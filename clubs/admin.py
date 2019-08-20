from django.contrib import admin
from django.db.models import Exists, OuterRef
from clubs.models import Club, Tag, Event, Membership, Favorite
from django.contrib.auth.models import Group


admin.site.unregister(Group)


class ClubAdmin(admin.ModelAdmin):
    search_fields = ('name', 'subtitle', 'email')
    list_display = ('name', 'email', 'has_owner')
    list_filter = ('size', 'application_required', 'application_available', 'listserv_available')

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(has_owner=Exists(Membership.objects.filter(club=OuterRef('pk'), role__lte=0)))

    def has_owner(self, obj):
        return obj.has_owner


class TagAdmin(admin.ModelAdmin):
    def club_count(self, obj):
        return obj.club_set.count()

    search_fields = ('name',)
    list_display = ('name', 'club_count')


class FavoriteAdmin(admin.ModelAdmin):
    search_fields = ('person__username', 'person__email', 'club__name', 'club__pk')


class MembershipAdmin(admin.ModelAdmin):
    search_fields = ('person__username', 'person__email', 'club__name', 'club__pk', 'title')
    list_filter = ('role',)


class EventAdmin(admin.ModelAdmin):
    search_fields = ('name', 'club__name')
    list_filter = ('start_time', 'end_time')


admin.site.register(Club, ClubAdmin)
admin.site.register(Tag, TagAdmin)
admin.site.register(Membership, MembershipAdmin)
admin.site.register(Favorite, FavoriteAdmin)
admin.site.register(Event, EventAdmin)
