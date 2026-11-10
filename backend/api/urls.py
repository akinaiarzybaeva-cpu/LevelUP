from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminAiProAPIView,
    AdminCoursesAPIView,
    AdminCurrentUserAPIView,
    AdminDashboardAPIView,
    AdminLessonsAPIView,
    AdminLoginAPIView,
    AdminLogsAPIView,
    AdminPaymentsAPIView,
    AdminPricingAPIView,
    AdminReviewsAPIView,
    AdminUsersAPIView,
    CourseViewSet,
    CurrentUserAPIView,
    EmailLoginAPIView,
    PricingPlanViewSet,
    UserRegisterAPIView,
)

router = DefaultRouter()
router.register("courses", CourseViewSet, basename="course")
router.register("pricing-plans", PricingPlanViewSet, basename="pricing-plan")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/register/", UserRegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", EmailLoginAPIView.as_view(), name="auth-login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("auth/me/", CurrentUserAPIView.as_view(), name="auth-me"),
    path("admin/auth/login/", AdminLoginAPIView.as_view(), name="admin-auth-login"),
    path("admin/me/", AdminCurrentUserAPIView.as_view(), name="admin-auth-me"),
    path("admin/dashboard/", AdminDashboardAPIView.as_view(), name="admin-dashboard"),
    path("admin/users/", AdminUsersAPIView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/", AdminUsersAPIView.as_view(), name="admin-user-detail"),
    path("admin/courses/", AdminCoursesAPIView.as_view(), name="admin-courses"),
    path("admin/courses/<int:course_id>/", AdminCoursesAPIView.as_view(), name="admin-course-detail"),
    path("admin/lessons/", AdminLessonsAPIView.as_view(), name="admin-lessons"),
    path("admin/lessons/<int:lesson_id>/", AdminLessonsAPIView.as_view(), name="admin-lesson-detail"),
    path("admin/pricing/", AdminPricingAPIView.as_view(), name="admin-pricing"),
    path("admin/pricing/<int:plan_id>/", AdminPricingAPIView.as_view(), name="admin-plan-detail"),
    path("admin/reviews/", AdminReviewsAPIView.as_view(), name="admin-reviews"),
    path("admin/reviews/<int:review_id>/", AdminReviewsAPIView.as_view(), name="admin-review-detail"),
    path("admin/payments/", AdminPaymentsAPIView.as_view(), name="admin-payments"),
    path("admin/payments/<int:payment_id>/", AdminPaymentsAPIView.as_view(), name="admin-payment-detail"),
    path("admin/ai-pro/", AdminAiProAPIView.as_view(), name="admin-ai-pro"),
    path("admin/ai-pro/<int:user_id>/", AdminAiProAPIView.as_view(), name="admin-ai-pro-detail"),
    path("admin/activity-logs/", AdminLogsAPIView.as_view(), name="admin-activity-logs"),
]
