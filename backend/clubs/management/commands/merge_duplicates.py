from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Count, Q

from clubs.models import (
    Club,
    Event,
    Favorite,
    Membership,
    MembershipInvite,
    Subscribe,
    Tag,
    Testimonial,
)


class Command(BaseCommand):
    help = "Helper to merge duplicate clubs and tags."

    def add_arguments(self, parser):
        parser.add_argument(
            "items",
            nargs="*",
            type=str,
            help="The ID or name of the clubs/tags to merge.",
        )
        parser.add_argument(
            "--tag",
            dest="tag",
            action="store_true",
            help="Merge tags instead of clubs.",
        )
        parser.add_argument(
            "--auto",
            dest="auto",
            action="store_true",
            help="Automatically detect and merge clubs by name.",
        )
        parser.set_defaults(auto=False, tag=False)

    def handle(self, *args, **kwargs):
        if kwargs["auto"]:
            self.stdout.write("Automatically merging duplicate clubs...")
            duplicates = (
                Club.objects.values("name")
                .annotate(name_count=Count("name"))
                .filter(name_count__gt=1)
            )
            duplicates = [x["name"] for x in duplicates]

            for duplicate in duplicates:
                clubs = Club.objects.filter(name=duplicate)
                num_clubs = clubs.count()
                final, rest = clubs[0], clubs[1:]
                for item in rest:
                    final = merge_clubs(final, item)
                self.stdout.write(
                    self.style.SUCCESS("Merged {} ({})".format(duplicate, num_clubs))
                )
        else:
            items = kwargs["items"]
            if kwargs["tag"]:
                tags = Tag.objects.filter(name__in=items)
                if tags.count() < 2:
                    raise CommandError("You must specify at least two tags to merge!")

                final, rest = tags[0], tags[1:]
                for item in rest:
                    final = merge_tags(final, item)

                self.stdout.write(self.style.SUCCESS("Merged {}".format(final.name)))
            else:
                clubs = Club.objects.filter(Q(code__in=items) | Q(name__in=items))
                if clubs.count() < 2:
                    raise CommandError("You must specify at least two clubs to merge!")
                final, rest = clubs[0], clubs[1:]
                for item in rest:
                    final = merge_clubs(final, item)
                self.stdout.write(self.style.SUCCESS("Merged {}".format(final.name)))


@transaction.atomic
def merge_tags(one, two):
    """
    Merges two tags and returns the combined tag.
    """
    # keep tag with the non-uppercase name
    if one.name.isupper():
        one, two = two, one
    elif not two.name.isupper():
        if len(one.name) < len(two.name):
            one, two = two, one

    one.club_set.add(*two.club_set.all())
    two.delete()
    return one


@transaction.atomic
def merge_clubs(one, two):
    """
    Merges two clubs and returns the combined club.
    """
    primary = one
    secondary = two

    # Keep the active club
    if not one.active and two.active:
        secondary = one
        primary = two

    membership_diff = one.membership_set.count() - two.membership_set.count()

    # Keep the club object with the most members
    if membership_diff < 0:
        secondary = one
        primary = two
        membership_diff = -membership_diff

    # Keep the club code with the most members
    if membership_diff < 0:
        primary.code = secondary.code
    elif membership_diff == 0:
        # Keep the club code that breaks the least invites
        invite_diff = (
            primary.membershipinvite_set.filter(active=True).count()
            - secondary.membershipinvite_set.filter(active=True).count()
        )
        if invite_diff < 0:
            primary.code = secondary.code
        elif invite_diff == 0:
            # Keep the shorter club code
            primary.code = min(primary.code, secondary.code)

    # If either club is active, set the resulting club as active
    primary.active = primary.active or secondary.active

    # Choose longest string or string that exists
    for field in [
        "name",
        "subtitle",
        "description",
        "address",
        "email",
        "facebook",
        "website",
        "twitter",
        "instagram",
        "github",
        "youtube",
        "how_to_get_involved",
        "listserv",
    ]:
        value = getattr(secondary, field)
        old_value = getattr(primary, field)
        if old_value is None or (value is not None and len(value) > len(old_value)):
            setattr(primary, field, value)

    # If either one is accepting members, the final one is as well
    primary.accepting_members = primary.accepting_members or secondary.accepting_members

    # If either one enables subscription, the final one does as well
    primary.enables_subscription = (
        primary.enables_subscription or secondary.enables_subscription
    )

    # Choose most restrictive application_required
    primary.application_required = max(
        primary.application_required, secondary.application_required
    )

    # Use the larger club size
    primary.size = max(primary.size, secondary.size)

    # Take all tags
    primary.tags.add(*secondary.tags.all())

    # Take all members
    duplicate_memberships = list(
        Membership.objects.filter(club=primary).values_list("person__id", flat=True)
    )
    Membership.objects.filter(
        club=secondary,
        person__in=duplicate_memberships,
    ).delete()
    Membership.objects.filter(club=secondary).update(club=primary)

    # Take all membership invites
    MembershipInvite.objects.filter(club=secondary).update(club=primary)

    # Take all testimonials
    Testimonial.objects.filter(club=secondary).update(club=primary)

    # Take all bookmarks and subscriptions
    for model in (Favorite, Subscribe):
        for fav in model.objects.filter(club=secondary):
            if model.objects.filter(person=fav.person, club=primary).exists():
                fav.delete()
            else:
                fav.club = primary
                fav.save()

    # Take all events
    Event.objects.filter(club=secondary).update(club=primary)

    secondary.delete()
    primary.save()

    return primary
