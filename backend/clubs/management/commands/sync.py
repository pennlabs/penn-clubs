from django.core.management.base import BaseCommand

from clubs.models import Badge, Club


class Command(BaseCommand):
    help = "Synchronizes badges based on parent and child org relationships."

    def recursively_add_badge(self, club, badge):
        if club.code in self._visited:
            return
        self._visited.add(club.code)
        if not club.badges.filter(pk=badge.pk).exists():
            self.stdout.write(f"Adding {badge.label} to {club.name}")
            club.badges.add(badge)
        for child in club.children_orgs.all():
            self.recursively_add_badge(club, badge)

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

        # add badges to parent child relationships
        for badge in Badge.objects.all():
            if badge.org is not None:
                self._visited = set()
                self.recursively_add_badge(badge.org, badge)

        # if badge exist on child, link it to the parent directly
        # unless it is already indirectly linked
        for badge in Badge.objects.all():
            if badge.org is not None:
                for club in badge.club_set.all():
                    if club.pk == badge.org.pk:
                        continue

                    parent_club_codes = self.get_parent_club_codes(club)
                    if badge.org.code not in parent_club_codes:
                        self.stdout.write(f"Adding {badge.org.name} as parent for {club.name}")
                        club.parent_orgs.add(badge.org)
