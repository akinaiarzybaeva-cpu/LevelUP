from datetime import datetime

from django.contrib.auth.models import User
from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import generics, permissions, serializers, viewsets
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_messages import auth_message, resolve_auth_language
from .models import AdminActivityLog, Course, Lesson, PricingPlan, Review, UserPayment, UserProfile
from .serializers import (
    AdminActivityLogSerializer,
    AdminUserSerializer,
    CourseSerializer,
    CurrentUserSerializer,
    LessonSerializer,
    PricingPlanSerializer,
    ReviewSerializer,
    UserPaymentSerializer,
    UserProfileAdminSerializer,
    UserRegisterSerializer,
)


def is_admin_user(user):
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if user.is_staff or user.is_superuser:
        return True
    profile = getattr(user, "profile", None)
    return bool(profile and getattr(profile, "role", "") == UserProfile.ROLE_ADMIN)


def require_admin(request):
    if not request.user or not request.user.is_authenticated:
        raise PermissionDenied("Admin authentication is required.")
    if not is_admin_user(request.user):
        raise PermissionDenied("Only administrators can access this endpoint.")


class EmailLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def _language(self):
        request = self.context.get("request")
        return resolve_auth_language(request=request, payload=getattr(self, "initial_data", {}))

    def validate(self, attrs):
        language = self._language()
        email = str(attrs.get("email", "")).strip().lower()
        password = attrs.get("password")
        user = User.objects.filter(email__iexact=email).first()
        if not user or not password or not user.check_password(password):
            raise AuthenticationFailed(auth_message("invalid_credentials", language))
        if not user.is_active:
            raise AuthenticationFailed(auth_message("inactive_account", language))
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class EmailLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailLoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class AdminLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()
        password = request.data.get("password", "")
        user = User.objects.filter(email__iexact=email).select_related("profile").first()
        if not user or not user.check_password(password):
            return Response({"detail": "Invalid admin credentials."}, status=401)
        if not user.is_active:
            return Response({"detail": "Admin account is inactive."}, status=403)
        if not is_admin_user(user):
            return Response({"detail": "Admin access required."}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": getattr(user.profile, "role", UserProfile.ROLE_ADMIN),
                "is_staff": user.is_staff,
            },
        })


class AdminCurrentUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        profile = getattr(request.user, "profile", None)
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": getattr(profile, "role", UserProfile.ROLE_ADMIN),
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
        })


class AdminDashboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        users_count = User.objects.count()
        registered_users = User.objects.filter(is_active=True).count()
        total_courses = Course.objects.count()
        total_lessons = Lesson.objects.count()
        active_plans = PricingPlan.objects.filter(is_active=True).count()
        ai_pro_users = UserProfile.objects.filter(ai_pro_active=True).count()
        total_reviews = Review.objects.count()
        average_rating = round(float(Review.objects.aggregate(avg=Avg("rating"))["avg"] or 0), 1)
        total_payments = UserPayment.objects.count()
        total_revenue = float(
            UserPayment.objects.filter(status=UserPayment.STATUS_PAID).aggregate(total=Sum("amount"))["total"] or 0
        )

        recent_users = []
        for user in User.objects.select_related("profile").order_by("-date_joined")[:5]:
            recent_users.append({
                "id": user.id,
                "email": user.email,
                "full_name": getattr(user.profile, "full_name", ""),
                "role": getattr(user.profile, "role", UserProfile.ROLE_MEMBER),
                "date_joined": user.date_joined.isoformat(),
                "is_active": user.is_active,
            })

        revenue_by_month = []
        monthly_map = {}
        for payment in UserPayment.objects.filter(status=UserPayment.STATUS_PAID).order_by("created_at"):
            month_key = payment.created_at.strftime("%Y-%m")
            month_label = payment.created_at.strftime("%b %Y")
            monthly_map.setdefault(month_key, {"label": month_label, "value": 0})
            monthly_map[month_key]["value"] += float(payment.amount or 0)

        for item in sorted(monthly_map.items())[-6:]:
            revenue_by_month.append({"label": item[1]["label"], "value": round(item[1]["value"], 2)})

        response = {
            "total_users": users_count,
            "registered_users": registered_users,
            "total_courses": total_courses,
            "total_lessons": total_lessons,
            "active_plans": active_plans,
            "ai_pro_users": ai_pro_users,
            "total_reviews": total_reviews,
            "average_rating": average_rating,
            "total_payments": total_payments,
            "total_revenue": total_revenue,
            "recent_users": recent_users,
            "revenue_by_month": revenue_by_month,
        }
        return Response(response)


class AdminUsersAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        users = User.objects.select_related("profile").order_by("-id")
        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data)

    def patch(self, request, user_id=None):
        require_admin(request)
        user = User.objects.select_related("profile").get(pk=user_id)
        profile = user.profile
        role = request.data.get("role", profile.role)
        is_blocked = request.data.get("is_blocked")
        ai_pro_active = request.data.get("ai_pro_active")
        plan_name = request.data.get("plan_name")
        if role in {UserProfile.ROLE_ADMIN, UserProfile.ROLE_MANAGER, UserProfile.ROLE_MEMBER}:
            profile.role = role
            user.is_staff = role == UserProfile.ROLE_ADMIN or role == UserProfile.ROLE_MANAGER
            user.is_superuser = role == UserProfile.ROLE_ADMIN
            user.save(update_fields=["is_staff", "is_superuser"])
        if is_blocked is not None:
            profile.is_blocked = bool(is_blocked)
        if ai_pro_active is not None:
            profile.ai_pro_active = bool(ai_pro_active)
        if plan_name is not None:
            profile.plan_name = str(plan_name)
        profile.save(update_fields=["role", "is_blocked", "ai_pro_active", "plan_name", "updated_at"])
        AdminActivityLog.objects.create(
            actor=request.user,
            action="updated_user",
            target_model="user",
            target_id=str(user.id),
            details=f"Updated profile for {user.email}",
            metadata={
                "role": profile.role,
                "is_blocked": profile.is_blocked,
                "ai_pro_active": profile.ai_pro_active,
                "plan_name": profile.plan_name,
            },
        )
        return Response(AdminUserSerializer(user).data)


class AdminCoursesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        return Response(CourseSerializer(Course.objects.all(), many=True).data)

    def post(self, request):
        require_admin(request)
        serializer = CourseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="created_course",
            target_model="course",
            target_id=str(course.id),
            details=f"Created course {course.title}",
        )
        return Response(serializer.data, status=201)

    def patch(self, request, course_id=None):
        require_admin(request)
        course = Course.objects.get(pk=course_id)
        serializer = CourseSerializer(course, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="updated_course",
            target_model="course",
            target_id=str(updated.id),
            details=f"Updated course {updated.title}",
        )
        return Response(serializer.data)

    def delete(self, request, course_id=None):
        require_admin(request)
        course = Course.objects.get(pk=course_id)
        title = course.title
        course.delete()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="deleted_course",
            target_model="course",
            target_id=str(course_id),
            details=f"Deleted course {title}",
        )
        return Response({"deleted": True, "course_id": course_id})


class AdminLessonsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        lessons = Lesson.objects.select_related("course").all()
        return Response(LessonSerializer(lessons, many=True).data)

    def post(self, request):
        require_admin(request)
        serializer = LessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="created_lesson",
            target_model="lesson",
            target_id=str(lesson.id),
            details=f"Created lesson {lesson.title}",
        )
        return Response(serializer.data, status=201)

    def patch(self, request, lesson_id=None):
        require_admin(request)
        lesson = Lesson.objects.get(pk=lesson_id)
        serializer = LessonSerializer(lesson, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="updated_lesson",
            target_model="lesson",
            target_id=str(updated.id),
            details=f"Updated lesson {updated.title}",
        )
        return Response(serializer.data)

    def delete(self, request, lesson_id=None):
        require_admin(request)
        lesson = Lesson.objects.get(pk=lesson_id)
        title = lesson.title
        lesson.delete()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="deleted_lesson",
            target_model="lesson",
            target_id=str(lesson_id),
            details=f"Deleted lesson {title}",
        )
        return Response({"deleted": True, "lesson_id": lesson_id})


class AdminPricingAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        return Response(PricingPlanSerializer(PricingPlan.objects.all(), many=True).data)

    def post(self, request):
        require_admin(request)
        serializer = PricingPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        plan = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="created_plan",
            target_model="pricing_plan",
            target_id=str(plan.id),
            details=f"Created plan {plan.name}",
        )
        return Response(serializer.data, status=201)

    def patch(self, request, plan_id=None):
        require_admin(request)
        plan = PricingPlan.objects.get(pk=plan_id)
        serializer = PricingPlanSerializer(plan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="updated_plan",
            target_model="pricing_plan",
            target_id=str(updated.id),
            details=f"Updated plan {updated.name}",
        )
        return Response(serializer.data)

    def delete(self, request, plan_id=None):
        require_admin(request)
        plan = PricingPlan.objects.get(pk=plan_id)
        name = plan.name
        plan.delete()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="deleted_plan",
            target_model="pricing_plan",
            target_id=str(plan_id),
            details=f"Deleted plan {name}",
        )
        return Response({"deleted": True, "plan_id": plan_id})


class AdminReviewsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        reviews = Review.objects.select_related("course", "lesson", "user").all()
        return Response(ReviewSerializer(reviews, many=True).data)

    def delete(self, request, review_id=None):
        require_admin(request)
        review = Review.objects.get(pk=review_id)
        review.delete()
        AdminActivityLog.objects.create(
            actor=request.user,
            action="deleted_review",
            target_model="review",
            target_id=str(review_id),
            details="Removed review entry",
        )
        return Response({"deleted": True, "review_id": review_id})


class AdminPaymentsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        payments = UserPayment.objects.select_related("user").all()
        return Response(UserPaymentSerializer(payments, many=True).data)

    def patch(self, request, payment_id=None):
        require_admin(request)
        payment = UserPayment.objects.get(pk=payment_id)
        status = request.data.get("status")
        if status in {UserPayment.STATUS_PENDING, UserPayment.STATUS_PAID, UserPayment.STATUS_FAILED, UserPayment.STATUS_MANUAL_REVIEW}:
            payment.status = status
            payment.updated_at = timezone.now()
            payment.save(update_fields=["status", "updated_at"])
            AdminActivityLog.objects.create(
                actor=request.user,
                action="updated_payment",
                target_model="payment",
                target_id=str(payment.id),
                details=f"Updated payment status to {status}",
                metadata={"status": status},
            )
        return Response(UserPaymentSerializer(payment).data)


class AdminAiProAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        profiles = UserProfile.objects.filter(ai_pro_active=True).select_related("user")
        data = []
        for profile in profiles:
            data.append({
                "id": profile.user.id,
                "email": profile.user.email,
                "full_name": profile.full_name,
                "ai_pro_active": True,
                "plan_name": profile.plan_name,
                "plan_expires_at": profile.plan_expires_at,
            })
        return Response(data)

    def patch(self, request, user_id=None):
        require_admin(request)
        user = User.objects.select_related("profile").get(pk=user_id)
        profile = user.profile
        state = request.data.get("ai_pro_active")
        if state is not None:
            profile.ai_pro_active = bool(state)
        if request.data.get("plan_name") is not None:
            profile.plan_name = str(request.data.get("plan_name"))
        if request.data.get("plan_expires_at"):
            try:
                profile.plan_expires_at = datetime.fromisoformat(request.data.get("plan_expires_at").replace("Z", "+00:00"))
            except ValueError:
                pass
        profile.save(update_fields=["ai_pro_active", "plan_name", "plan_expires_at", "updated_at"])
        AdminActivityLog.objects.create(
            actor=request.user,
            action="updated_ai_pro",
            target_model="user_profile",
            target_id=str(user.id),
            details=f"Updated AI Pro status for {user.email}",
            metadata={"ai_pro_active": profile.ai_pro_active, "plan_name": profile.plan_name},
        )
        return Response({"id": user.id, "email": user.email, "ai_pro_active": profile.ai_pro_active, "plan_name": profile.plan_name})


class AdminLogsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        logs = AdminActivityLog.objects.select_related("actor").all()[:50]
        return Response(AdminActivityLogSerializer(logs, many=True).data)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class PricingPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PricingPlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return PricingPlan.objects.filter(is_active=True)


class UserRegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _has_email_exists_code(detail):
        if isinstance(detail, list):
            return any(UserRegisterAPIView._has_email_exists_code(item) for item in detail)
        if isinstance(detail, dict):
            return any(UserRegisterAPIView._has_email_exists_code(item) for item in detail.values())
        return getattr(detail, "code", None) == "email_exists"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            status_code = 409 if self._has_email_exists_code(serializer.errors) else 400
            return Response(serializer.errors, status=status_code)
        return super().create(request, *args, **kwargs)


class CurrentUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
