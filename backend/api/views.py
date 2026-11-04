from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, PricingPlan
from .serializers import (
    CourseSerializer,
    CurrentUserSerializer,
    PricingPlanSerializer,
    UserRegisterSerializer,
)


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


class CurrentUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data)
