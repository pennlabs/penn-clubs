"""
Sitemap paths API for next-sitemap integration.

This module provides a JSON endpoint returning dynamic paths (clubs, events)
that next-sitemap will merge with auto-detected static pages.
"""

from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from clubs.models import Club, Event


class SitemapPathsView(APIView):
    """
    Return JSON list of dynamic paths for sitemap generation.

    This endpoint returns paths for:
    1. Club detail pages for clubs visible to public/unauthenticated users
    2. Event pages for events from visible clubs or global events

    The visibility criteria matches ClubViewSet.get_queryset() for public viewers:
    - archived=False
    - active=True
    - visible_to_public=True
    - approved=True OR ghost=True

    next-sitemap will call this endpoint and merge these paths with
    auto-detected static Next.js pages.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        """
        Return JSON array of dynamic sitemap paths.
        ---
        responses:
            "200":
                content:
                    application/json:
                        schema:
                            type: array
                            items:
                                type: string
                            example: ["/club/penn-labs/", "/events/123/"]
        ---
        """
        paths = []

        # Query visible clubs using same filters as ClubViewSet for public viewers
        visible_clubs = Club.objects.filter(
            archived=False,
            active=True,
            visible_to_public=True,
        ).filter(Q(approved=True) | Q(ghost=True))

        # Club paths
        for code in visible_clubs.values_list("code", flat=True):
            paths.append(f"/club/{code}/")

        # Query events from visible clubs (or global events with club=null)
        # Same visibility logic as EventViewSet for public viewers
        events = (
            Event.objects.filter(
                Q(club__in=visible_clubs) | Q(club__isnull=True),
            )
            .filter(
                Q(club__isnull=True)
                | Q(club__approved=True)
                | Q(type=Event.FAIR)
                | Q(club__ghost=True)
            )
            .values_list("id", flat=True)
        )

        # Event paths
        for event_id in events:
            paths.append(f"/events/{event_id}/")

        return Response(paths)
