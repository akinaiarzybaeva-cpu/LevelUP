from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
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
]
