from django.contrib.auth.models import User
from rest_framework import generics, permissions, serializers, viewsets
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_messages import auth_message, resolve_auth_language
from .models import Course, PricingPlan
from .serializers import (
    CourseSerializer,
    CurrentUserSerializer,
    PricingPlanSerializer,
    UserRegisterSerializer,
)


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
