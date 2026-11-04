from django.contrib import admin

from .models import Course, PricingPlan, UserProfile


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "level", "is_published", "updated_at")
    search_fields = ("title", "category", "description")
    list_filter = ("level", "is_published")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(PricingPlan)
class PricingPlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "currency", "billing_period", "is_active")
    list_filter = ("billing_period", "is_active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "phone", "preferred_language", "created_at")
    search_fields = ("user__username", "user__email", "full_name", "phone")
