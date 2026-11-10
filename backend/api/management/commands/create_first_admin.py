from django.core.management.base import BaseCommand

from api.admin_bootstrap import ensure_first_admin


class Command(BaseCommand):
    help = "Creates the first admin account from ADMIN_EMAIL and ADMIN_PASSWORD environment variables only once."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Show what would happen without changing the database.")

    def handle(self, *args, **options):
        result = ensure_first_admin(dry_run=options["dry_run"])
        status = result.get("status")

        if status == "created":
            self.stdout.write(self.style.SUCCESS(f"Admin created for {result['email']}"))
            return

        if status == "exists":
            self.stdout.write(self.style.WARNING(f"Admin account already exists for {result.get('email', 'the configured email')}."))
            return

        if status == "dry_run":
            self.stdout.write(self.style.WARNING(f"Dry run: would create admin account for {result['email']}"))
            return

        self.stdout.write(self.style.WARNING(result.get("reason", "No admin was created.")))
