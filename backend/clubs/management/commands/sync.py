from django.core.management.base import BaseCommand
from django.db.models import Count

from clubs.models import Badge, Club, ClubFairRegistration


class Command(BaseCommand):
    help = (
        "Executes various operations to ensure that the database is in a consistent "
        "state. Synchronizes badges based on parent and child org relationships. "
        "Removes duplicate club fair registration entries, keeping the latest. "
        "There should be no issues with repeatedly running this script. "
    )
    web_execute = True

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            dest="dry_run",
            action="store_true",
            help="Do not actually modify anything.",
        )
        parser.set_defaults(dry_run=False)

    def recursively_add_badge(self, club, badge):
        if club.code in self._visited:
            return 0
        self._visited.add(club.code)
        count = 0
        if not club.badges.filter(pk=badge.pk).exists():
            if not self.dry_run:
                self.stdout.write(f"Adding badge {badge.label} to club {club.name}.")
                club.badges.add(badge)
            else:
                self.stdout.write(
                    f"Would have added badge {badge.label} to club {club.name}."
                )
            count += 1
        for child in club.children_orgs.all():
            return self.recursively_add_badge(club, badge) + count
        return count

    def get_parent_club_codes(self, club):
        queue = [club.code]
        found = set()

        while queue:
            item = queue.pop(0)
            if item in found:
                continue

            found.add(item)
            club = Club.objects.get(code=item)
            for parent in club.parent_orgs.all():
                queue.append(parent.code)

        return found

    def handle(self, *args, **kwargs):
        self.dry_run = kwargs["dry_run"]
        if self.dry_run:
            self.stdout.write(
                "Running in dry run mode, no changes will actually be made."
            )

        self.sync_badges()
        self.sync_club_fairs()

    def sync_club_fairs(self):
        """
        Remove duplicate club fair registrations if they exist,
        only keeping the latest registration.
        """
        for dup in (
            ClubFairRegistration.objects.values("club__code", "fair__id")
            .annotate(Count("id"))
            .filter(id__count__gt=1)
        ):
            club_code = dup["club__code"]
            fair_id = dup["fair__id"]
            self.stdout.write(
                "Found duplicate fair registration entry with "
                f"club code '{club_code}' and fair id '{fair_id}'."
            )
            dups = (
                ClubFairRegistration.objects.filter(
                    fair__id=fair_id, club__code=club_code
                )
                .order_by("-created_at")
                .values_list("id", flat=True)[1:]
            )
            if not self.dry_run:
                num = ClubFairRegistration.objects.filter(id__in=dups).delete()
                self.stdout.write(f"Deleted {num} duplicate entries!")
            else:
                self.stdout.write(f"Would have deleted {len(dups)} duplicate entries!")

    def sync_badges(self):
        """
        Synchronizes badges based on parent child relationships.
        Tends to favor adding objects to fix relationships instead of removing them.
        """
        # add badges to parent child relationships
        count = 0
        for badge in Badge.objects.all():
            if badge.org is not None:
                self._visited = set()
                count += self.recursively_add_badge(badge.org, badge)
        self.stdout.write(
            self.style.SUCCESS(f"Modified {count} club badge relationships.")
        )

        # if badge exist on child, link it to the parent directly
        # unless it is already indirectly linked
        count = 0
        for badge in Badge.objects.all():
            if badge.org is not None:
                for club in badge.club_set.all():
                    if club.pk == badge.org.pk:
                        continue

                    parent_club_codes = self.get_parent_club_codes(club)
                    if badge.org.code not in parent_club_codes:
                        if not self.dry_run:
                            self.stdout.write(
                                f"Adding {badge.org.name} as parent for {club.name}."
                            )
                            club.parent_orgs.add(badge.org)
                        else:
                            self.stdout.write(
                                f"Would have added {badge.org.name} "
                                f"as a parent for {club.name}."
                            )
                        count += 1
        self.stdout.write(
            self.style.SUCCESS(f"Modified {count} parent child relationships.")
        )
