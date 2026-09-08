"""
Tests for the catalog backfill of the Major table (migration 0144).
"""

from importlib import import_module

from django.test import TestCase

from clubs.models import Club, Major, Profile, TargetMajor


# Migration modules start with a digit, so they cannot be imported normally.
migration = import_module("clubs.migrations.0144_add_missing_majors")
MISSING_MAJORS = migration.MISSING_MAJORS
add_missing_majors = migration.add_missing_majors


class FakeApps:
    """Minimal stand-in for the `apps` registry passed to a data migration."""

    def get_model(self, app_label, model_name):
        assert (app_label, model_name) == ("clubs", "Major")
        return Major


class MissingMajorsDataTestCase(TestCase):
    def test_list_is_non_empty(self):
        self.assertGreater(len(MISSING_MAJORS), 0)

    def test_no_duplicates_within_the_list(self):
        self.assertEqual(len(MISSING_MAJORS), len(set(MISSING_MAJORS)))

    def test_every_entry_is_a_non_blank_string(self):
        for name in MISSING_MAJORS:
            self.assertIsInstance(name, str)
            self.assertEqual(name, name.strip())
            self.assertTrue(name)

    def test_artificial_intelligence_is_included(self):
        """The gap that prompted this backfill."""
        self.assertIn("Artificial Intelligence, BSE", MISSING_MAJORS)


class AddMissingMajorsTestCase(TestCase):
    """
    The migration has already run against the test database, so these exercise
    the function directly to prove its behaviour under re-application.
    """

    def test_all_entries_were_inserted(self):
        """
        Nothing else in the migration history creates majors, so a freshly
        migrated database should contain exactly this list.
        """
        self.assertEqual(Major.objects.count(), len(MISSING_MAJORS))

    def test_migration_has_been_applied(self):
        for name in ("Artificial Intelligence, BSE", "Artificial Intelligence, MSE"):
            self.assertTrue(Major.objects.filter(name=name).exists(), name)

    def test_is_idempotent(self):
        before = Major.objects.count()
        add_missing_majors(FakeApps(), None)
        self.assertEqual(Major.objects.count(), before)

    def test_creates_no_duplicate_names(self):
        add_missing_majors(FakeApps(), None)
        names = list(Major.objects.values_list("name", flat=True))
        self.assertEqual(len(names), len(set(names)))

    def test_adds_only_what_is_missing(self):
        removed = Major.objects.filter(name="Artificial Intelligence, BSE")
        removed.delete()
        before = Major.objects.count()

        add_missing_majors(FakeApps(), None)

        self.assertEqual(Major.objects.count(), before + 1)
        self.assertTrue(
            Major.objects.filter(name="Artificial Intelligence, BSE").exists()
        )

    def test_does_not_rename_existing_majors(self):
        existing = Major.objects.create(name="Totally Made Up Program, BA")
        add_missing_majors(FakeApps(), None)
        existing.refresh_from_db()
        self.assertEqual(existing.name, "Totally Made Up Program, BA")

    def test_does_not_delete_existing_majors(self):
        existing = Major.objects.create(name="Another Made Up Program, BA")
        add_missing_majors(FakeApps(), None)
        self.assertTrue(Major.objects.filter(pk=existing.pk).exists())

    def test_leaves_profile_and_club_relations_intact(self):
        """
        Major is M2M'd to Profile and reached through TargetMajor with
        on_delete=CASCADE, so a backfill must not disturb either.
        """
        club = Club.objects.create(code="testclub", name="Test Club")
        major = Major.objects.create(name="Relation Test Program, BA")
        TargetMajor.objects.create(club=club, target_majors=major)

        profile = Profile.objects.first()
        if profile is not None:
            profile.major.add(major)

        add_missing_majors(FakeApps(), None)

        self.assertTrue(
            TargetMajor.objects.filter(club=club, target_majors=major).exists()
        )
        if profile is not None:
            self.assertIn(major, profile.major.all())
