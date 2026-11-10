import os

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction

from .models import UserProfile


def ensure_first_admin(email=None, password=None, dry_run=False):
    admin_email = (email or os.getenv("ADMIN_EMAIL") or "").strip().lower()
    admin_password = password if password is not None else os.getenv("ADMIN_PASSWORD") or ""

    if not admin_email or not admin_password:
        return {"status": "skipped", "reason": "ADMIN_EMAIL and ADMIN_PASSWORD are not configured."}

    User = get_user_model()
    existing_user = User.objects.filter(email__iexact=admin_email).select_related("profile").first()
    if existing_user:
        profile = getattr(existing_user, "profile", None)
        if profile and profile.role == UserProfile.ROLE_ADMIN:
            return {"status": "exists", "created": False, "email": admin_email, "user_id": existing_user.id}
        return {
            "status": "skipped",
            "reason": "An account with this email already exists but is not an admin account.",
            "email": admin_email,
        }

    if UserProfile.objects.filter(role=UserProfile.ROLE_ADMIN).exists():
        return {"status": "exists", "created": False, "email": admin_email}

    if dry_run:
        return {"status": "dry_run", "created": False, "email": admin_email, "role": UserProfile.ROLE_ADMIN}

    with transaction.atomic():
        username = admin_email.split("@")[0][:30] or "admin"
        base_username = username
        counter = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        hashed_password = make_password(admin_password)
        user = User.objects.create(username=username, email=admin_email, password=hashed_password)
        user.is_staff = True
        user.is_superuser = True
        user.save(update_fields=["is_staff", "is_superuser"])

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = UserProfile.ROLE_ADMIN
        profile.full_name = "Administrator"
        profile.save(update_fields=["role", "full_name", "updated_at"])

    return {"status": "created", "created": True, "email": admin_email, "user_id": user.id}
