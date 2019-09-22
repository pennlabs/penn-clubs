from django.contrib import admin, messages
from django.contrib.auth.models import Group
from django.db.models import Exists, OuterRef

from clubs.management.commands.merge_duplicates import merge_clubs, merge_tags
from clubs.models import Asset, Badge, Club, Event, Favorite, Membership, MembershipInvite, Tag


class HasOwnerListFilter(admin.SimpleListFilter):
    title = 'has owner'
    parameter_name = 'has_owner'

    def lookups(self, request, model_admin):
        return [('true', 'True'), ('false', 'False')]

    def queryset(self, request, queryset):
        val = self.value()
        if val:
            return queryset.filter(has_owner=val == 'true')
        else:
            return queryset


class HasInviteListFilter(admin.SimpleListFilter):
    title = 'has invite'
    parameter_name = 'has_invite'

    def lookups(self, request, model_admin):
        return [('true', 'True'), ('false', 'False')]

    def queryset(self, request, queryset):
        val = self.value()
        if val:
            return queryset.filter(has_invite=val == 'true')
        else:
            return queryset


def do_merge_clubs(modeladmin, request, queryset):
    if queryset.count() < 2:
        modeladmin.message_user(request, 'You must select at least two clubs to merge!', level=messages.ERROR)
    club_names = list(queryset.order_by('name').values_list('name', flat=True))
    tags = list(queryset)
    first, rest = tags[0], tags[1:]
    for club in rest:
        merge_clubs(first, club)
    modeladmin.message_user(
        request,
        'Merged the following clubs: {} into {}'.format(', '.join(club_names), first.name),
        level=messages.SUCCESS
    )


do_merge_clubs.short_description = 'Merge selected clubs'


class ClubAdmin(admin.ModelAdmin):
    search_fields = ('name', 'subtitle', 'email')
    list_display = ('name', 'email', 'has_owner', 'has_invite', 'active', 'approved')
    list_filter = ('size', 'application_required', 'accepting_members', 'active', 'approved',
                   HasOwnerListFilter, HasInviteListFilter)
    actions = [do_merge_clubs]

    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            has_owner=Exists(Membership.objects.filter(club=OuterRef('pk'), role__lte=0)),
            has_invite=Exists(MembershipInvite.objects.filter(club=OuterRef('pk')))
        )

    def has_invite(self, obj):
        return obj.has_invite
    has_invite.boolean = True

    def has_owner(self, obj):
        return obj.has_owner
    has_owner.boolean = True


class EventAdmin(admin.ModelAdmin):
    search_fields = ('name', 'club__name')
    list_filter = ('start_time', 'end_time')


class FavoriteAdmin(admin.ModelAdmin):
    search_fields = ('person__username', 'person__email', 'club__name', 'club__pk')
    list_display = ('person', 'club')

    def person(self, obj):
        return obj.person.username

    def club(self, obj):
        return obj.club.name


class MembershipAdmin(admin.ModelAdmin):
    search_fields = ('person__username', 'person__email', 'club__name', 'club__pk', 'title')
    list_display = ('person', 'club', 'role', 'title')
    list_filter = ('role',)

    def person(self, obj):
        return obj.person.username

    def club(self, obj):
        return obj.club.name


class MembershipInviteAdmin(admin.ModelAdmin):
    search_fields = ('email', 'club__name', 'club__pk')
    list_display = ('email', 'club', 'role', 'title', 'active')
    list_filter = ('role', 'active')

    def club(self, obj):
        return obj.club.name


def do_merge_tags(modeladmin, request, queryset):
    if queryset.count() < 2:
        modeladmin.message_user(request, 'You must select at least two tags to merge!', level=messages.ERROR)
    tag_names = list(queryset.order_by('name').values_list('name', flat=True))
    tags = list(queryset)
    first, rest = tags[0], tags[1:]
    for tag in rest:
        merge_tags(first, tag)
    modeladmin.message_user(
        request,
        'Merged the following tags: {} into {}'.format(', '.join(tag_names), first.name),
        level=messages.SUCCESS
    )


do_merge_tags.short_description = 'Merge selected tags'


class TagAdmin(admin.ModelAdmin):
    def club_count(self, obj):
        return obj.club_set.count()

    search_fields = ('name',)
    list_display = ('name', 'club_count')
    actions = [do_merge_tags]


class BadgeAdmin(admin.ModelAdmin):
    def club_count(self, obj):
        return obj.club_set.count()

    search_fields = ('label',)
    list_display = ('label', 'club_count')
    actions = [do_merge_tags]


admin.site.unregister(Group)


admin.site.register(Asset)
admin.site.register(Club, ClubAdmin)
admin.site.register(Badge, BadgeAdmin)
admin.site.register(Event, EventAdmin)
admin.site.register(Favorite, FavoriteAdmin)
admin.site.register(Membership, MembershipAdmin)
admin.site.register(MembershipInvite, MembershipInviteAdmin)
admin.site.register(Tag, TagAdmin)
