from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Course, PricingPlan, UserProfile


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = "__all__"


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ("full_name", "phone", "preferred_language", "created_at")
        read_only_fields = ("created_at",)


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    preferred_language = serializers.CharField(required=False, allow_blank=True, default="en")

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "full_name", "phone", "preferred_language")
        read_only_fields = ("id",)

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        phone = validated_data.pop("phone", "")
        preferred_language = validated_data.pop("preferred_language", "en")

        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            preferred_language=preferred_language or "en",
        )
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "profile")
