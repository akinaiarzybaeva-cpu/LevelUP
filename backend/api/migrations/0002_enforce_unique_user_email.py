from django.db import migrations
from django.db.models import Count
from django.db.models.functions import Lower, Trim


def fail_when_duplicate_emails_exist(apps, schema_editor):
    User = apps.get_model("auth", "User")
    duplicates = (
        User.objects.exclude(email__isnull=True)
        .exclude(email__exact="")
        .annotate(normalized_email=Lower(Trim("email")))
        .values("normalized_email")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
    )
    if not duplicates:
        return

    duplicate_list = ", ".join(row["normalized_email"] for row in duplicates[:10])
    raise RuntimeError(
        "Duplicate emails detected in auth_user. Resolve duplicates before applying this migration. "
        f"Examples: {duplicate_list}"
    )


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(fail_when_duplicate_emails_exist, migrations.RunPython.noop),
        migrations.RunSQL(
            sql="""
                UPDATE auth_user
                SET email = LOWER(TRIM(email))
                WHERE email IS NOT NULL AND TRIM(email) <> '';
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX IF NOT EXISTS auth_user_email_unique_ci
                ON auth_user (LOWER(TRIM(email)))
                WHERE TRIM(email) <> '';
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS auth_user_email_unique_ci;
            """,
        ),
    ]
