from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.signing import TimestampSigner

from clubs.models import Club, send_mail_helper


class Command(BaseCommand):
    help = (
        "Email club officers to configure whether their club is visible to the public."
    )
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually send emails; print what would be sent.",
        )
        parser.add_argument(
            "--clubs",
            type=str,
            default="",
            help="Comma-separated list of club codes to target.",
        )
        parser.add_argument(
            "--include-public",
            dest="include_public",
            action="store_true",
            help="Also email clubs that are already public.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Maximum number of club emails to send.",
        )

    def handle(self, *args, **options):
        if settings.BRANDING == "fyh":
            self.stdout.write(
                "notify_public_visibility is not supported for Hub@Penn (fyh). "
                "Skipping."
            )
            return

        dry_run: bool = options["dry_run"]
        include_public: bool = options["include_public"]
        limit: int | None = options["limit"]

        club_codes = [
            code.strip()
            for code in (options.get("clubs") or "").split(",")
            if code.strip()
        ]

        queryset = Club.objects.filter(archived=False, active=True).order_by("code")
        if club_codes:
            queryset = queryset.filter(code__in=club_codes)
        if not include_public:
            queryset = queryset.filter(visible_to_public=False)

        total = queryset.count()
        sent = 0
        skipped_no_recipients = 0

        self.stdout.write(
            f"Targeting {total} club(s)"
            + (" (dry run)" if dry_run else "")
            + (f", limit={limit}" if limit is not None else "")
        )

        for club in queryset.iterator():
            if limit is not None and sent >= limit:
                break

            emails = club.get_officer_emails()
            if not emails:
                skipped_no_recipients += 1
                continue

            signer = TimestampSigner(salt=f"club-public-visibility:{club.code}")
            token = signer.sign("ok")

            context = {
                "name": club.name,
                "code": club.code,
                "site_name": settings.BRANDING_SITE_NAME,
                "visible_to_public": club.visible_to_public,
                "edit_url": settings.EDIT_URL.format(
                    domain=settings.DEFAULT_DOMAIN, club=club.code
                ),
                "view_url": settings.VIEW_URL.format(
                    domain=settings.DEFAULT_DOMAIN, club=club.code
                ),
                "make_public_url": (
                    f"https://{settings.DEFAULT_DOMAIN}/api/clubs/{club.code}"
                    f"/public-visibility/{token}/?visible=true"
                ),
                "make_private_url": (
                    f"https://{settings.DEFAULT_DOMAIN}/api/clubs/{club.code}"
                    f"/public-visibility/{token}/?visible=false"
                ),
            }

            if dry_run:
                self.stdout.write(
                    f"- {club.code}: would email {len(emails)} recipient(s)"
                )
                continue

            send_mail_helper(
                name="public_visibility",
                subject=f"[ACTION REQUIRED] Set public visibility for {club.name}",
                emails=emails,
                context=context,
                reply_to=settings.OSA_EMAILS + [settings.BRANDING_SITE_EMAIL],
            )
            sent += 1

        self.stdout.write(
            f"Done. sent={sent}, skipped_no_recipients={skipped_no_recipients}"
        )
