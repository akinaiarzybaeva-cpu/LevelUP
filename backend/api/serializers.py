import logging

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email
from django.db import IntegrityError, transaction
from rest_framework import serializers

from .auth_messages import auth_message, resolve_auth_language
from .models import Course, PricingPlan, UserProfile

logger = logging.getLogger(__name__)


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
    username = serializers.CharField(required=False, allow_blank=True, write_only=True)
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=True, allow_blank=False, write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    preferred_language = serializers.CharField(required=False, allow_blank=True, default="en", write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "full_name", "phone", "preferred_language")
        read_only_fields = ("id",)

    def _language(self):
        request = self.context.get("request")
        return resolve_auth_language(request=request, payload=getattr(self, "initial_data", {}))

    def validate_email(self, value):
        language = self._language()
        normalized_email = str(value or "").strip().lower()
        if not normalized_email:
            raise serializers.ValidationError(auth_message("email_required", language))
        try:
            django_validate_email(normalized_email)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(auth_message("invalid_email_format", language)) from exc
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError(auth_message("email_exists", language), code="email_exists")
        return normalized_email

    def validate_full_name(self, value):
        language = self._language()
        full_name = str(value or "").strip()
        if not full_name:
            raise serializers.ValidationError(auth_message("full_name_required", language))
        return full_name

    def validate_password(self, value):
        language = self._language()
        password = str(value or "")
        if len(password) < 8:
            raise serializers.ValidationError(auth_message("password_too_short", language))
        return password

    def create(self, validated_data):
        language = self._language()
        validated_data.pop("username", None)
        full_name = validated_data.pop("full_name", "")
        phone = validated_data.pop("phone", "")
        preferred_language = validated_data.pop("preferred_language", "en")
        email = validated_data["email"]
        username = email
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                {"email": [serializers.ErrorDetail(auth_message("email_exists", language), code="email_exists")]}
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username, **validated_data)
                UserProfile.objects.create(
                    user=user,
                    full_name=full_name,
                    phone=phone,
                    preferred_language=preferred_language or "en",
                )
            return user
        except IntegrityError as exc:
            message = str(exc)
            is_email_conflict = (
                "auth_user_email_unique_ci" in message
                or "auth_user.username" in message
                or "auth_user_username_key" in message
            )
            if is_email_conflict:
                raise serializers.ValidationError(
                    {"email": [serializers.ErrorDetail(auth_message("email_exists", language), code="email_exists")]}
                ) from exc
            logger.exception("User registration failed due to database integrity error")
            raise


class CurrentUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "profile")
