"""
Prove migration 0148 adds orders without changing the cart schema or the
0145 ticket backfill.

The test database is created by migrating from zero. Upgrading a database
that is still on 0143 or 0147 must land on that same schema.
"""

import importlib
from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import IntegrityError, connection, models, transaction
from django.db.migrations.autodetector import MigrationAutodetector
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.operations.fields import RemoveField
from django.db.migrations.operations.models import DeleteModel
from django.db.migrations.state import ProjectState
from django.db.models.deletion import ProtectedError
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from clubs.models import (
    Cart,
    CartItem,
    Club,
    Event,
    EventShowing,
    Order,
    OrderItem,
    Ticket,
    TicketClass,
)
from tests.clubs.test_ticketing import commonSetUp


# 0148_orders is not a valid Python identifier.
orders_migration = importlib.import_module("clubs.migrations.0148_orders")


def _normalize(value):
    if value is None:
        return None
    return " ".join(str(value).split())


def schema_fingerprint():
    """
    Structural snapshot of the clubs tables, ignoring row contents and column
    order. Used to compare a from-zero database with one upgraded through 0148.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT
                c.relname,
                a.attname,
                pg_catalog.format_type(a.atttypid, a.atttypmod),
                a.attnotnull,
                pg_get_expr(ad.adbin, ad.adrelid)
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            LEFT JOIN pg_attrdef ad
                ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
            WHERE n.nspname = 'public'
              AND c.relkind = 'r'
              AND a.attnum > 0
              AND NOT a.attisdropped
              AND c.relname LIKE 'clubs\\_%' ESCAPE '\\'
            ORDER BY c.relname, a.attname
            """
        )
        columns = tuple(
            (table, column, _normalize(typ), notnull, _normalize(default))
            for table, column, typ, notnull, default in cursor.fetchall()
        )

        cursor.execute(
            """
            SELECT c.relname, con.conname, pg_get_constraintdef(con.oid)
            FROM pg_constraint con
            JOIN pg_class c ON c.oid = con.conrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname LIKE 'clubs\\_%' ESCAPE '\\'
            ORDER BY c.relname, con.conname
            """
        )
        constraints = tuple(
            (table, name, _normalize(definition))
            for table, name, definition in cursor.fetchall()
        )

        cursor.execute(
            """
            SELECT tablename, indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public' AND tablename LIKE 'clubs\\_%' ESCAPE '\\'
            ORDER BY tablename, indexname
            """
        )
        indexes = tuple(
            (table, name, _normalize(definition))
            for table, name, definition in cursor.fetchall()
        )

        cursor.execute(
            """
            SELECT c.relname, t.tgname, pg_get_triggerdef(t.oid)
            FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
              AND c.relname LIKE 'clubs\\_%' ESCAPE '\\'
              AND NOT t.tgisinternal
            ORDER BY c.relname, t.tgname
            """
        )
        triggers = tuple(
            (table, name, _normalize(definition))
            for table, name, definition in cursor.fetchall()
        )

        cursor.execute(
            """
            SELECT p.proname, pg_get_functiondef(p.oid)
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname LIKE 'clubs\\_%' ESCAPE '\\'
            ORDER BY p.proname
            """
        )
        functions = tuple(
            (name, _normalize(definition)) for name, definition in cursor.fetchall()
        )

    return {
        "columns": columns,
        "constraints": constraints,
        "indexes": indexes,
        "triggers": triggers,
        "functions": functions,
    }


class OrderSchemaTests(TestCase):
    def setUp(self):
        commonSetUp(self)

    def make_order(self, **kwargs):
        fields = {
            "showing": self.event_showing1,
            "status": Order.PENDING,
            "total": Decimal("15.00"),
            "buyer_first_name": "Ada",
            "buyer_last_name": "Lovelace",
            "buyer_email": "ada@example.com",
        }
        fields.update(kwargs)
        return Order.objects.create(**fields)

    def test_migrations_match_order_models(self):
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        autodetector = MigrationAutodetector(
            executor.loader.project_state(),
            ProjectState.from_apps(apps),
        )
        changes = autodetector.changes(graph=executor.loader.graph)
        self.assertNotIn("clubs", changes)

    def test_migration_keeps_cart_checkout_column(self):
        self.assertIn(
            ("clubs", "0147_unique_cart_per_showing"),
            orders_migration.Migration.dependencies,
        )
        for operation in orders_migration.Migration.operations:
            self.assertNotIsInstance(operation, DeleteModel)
            if isinstance(operation, RemoveField):
                self.assertNotEqual(operation.model_name, "cart")

        self.assertIs(
            CartItem._meta.get_field("ticket_class").remote_field.on_delete,
            models.CASCADE,
        )
        self.assertIs(
            OrderItem._meta.get_field("ticket_class").remote_field.on_delete,
            models.PROTECT,
        )

    def test_one_open_order_per_owner_and_session(self):
        self.make_order(owner=self.user1, session_key="shared")
        with transaction.atomic(), self.assertRaises(IntegrityError):
            self.make_order(owner=self.user1, status=Order.PROCESSING)
        with transaction.atomic(), self.assertRaises(IntegrityError):
            self.make_order(owner=self.user1, status=Order.PENDING)

        # NEEDS_REVIEW is not an open status, so it does not take the slot.
        self.make_order(owner=self.user1, status=Order.NEEDS_REVIEW)
        self.make_order(owner=self.user1, status=Order.PAID)
        self.make_order(owner=self.user1, status=Order.NEEDS_REVIEW)
        self.make_order(owner=self.user2)
        self.make_order(owner=self.user1, showing=self.unapproved_event_showing)

        self.make_order(session_key="guest-session")
        with transaction.atomic(), self.assertRaises(IntegrityError):
            self.make_order(session_key="guest-session", status=Order.PROCESSING)
        self.make_order(session_key="guest-session", status=Order.NEEDS_REVIEW)
        self.make_order(session_key="guest-session", status=Order.EXPIRED)
        self.make_order(session_key="other-session")
        # An authenticated order does not occupy the guest slot.
        self.make_order(
            showing=self.unapproved_event_showing, session_key="other-session"
        )
        self.make_order(
            owner=self.user2,
            showing=self.unapproved_event_showing,
            session_key="other-session",
        )

    def test_cart_item_cascades_and_order_item_is_protected(self):
        cart = Cart.objects.create(showing=self.event_showing1, owner=self.user1)
        CartItem.objects.create(cart=cart, ticket_class=self.premium_class, quantity=1)
        self.premium_class.delete()
        self.assertTrue(Cart.objects.filter(id=cart.id).exists())
        self.assertFalse(CartItem.objects.filter(cart=cart).exists())

        order = self.make_order(owner=self.user1)
        OrderItem.objects.create(
            order=order,
            ticket_class=self.normal_class,
            quantity=2,
            unit_price=Decimal("15.00"),
            line_total=Decimal("30.00"),
        )
        with transaction.atomic(), self.assertRaises(IntegrityError):
            OrderItem.objects.create(
                order=order,
                ticket_class=self.normal_class,
                quantity=1,
                unit_price=Decimal("15.00"),
                line_total=Decimal("15.00"),
            )
        with self.assertRaises(ProtectedError):
            self.normal_class.delete()
        self.assertTrue(OrderItem.objects.filter(order=order).exists())

    def test_existing_order_item_and_frozen_order_fields_raise(self):
        order = self.make_order(
            owner=self.user1,
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        item = OrderItem.objects.bulk_create(
            [
                OrderItem(
                    order=order,
                    ticket_class=self.normal_class,
                    quantity=2,
                    unit_price=Decimal("15.00"),
                    line_total=Decimal("30.00"),
                )
            ]
        )[0]
        item = OrderItem.objects.get(pk=item.pk)
        item.quantity = 1
        item.ticket_class = self.premium_class
        with self.assertRaises(ValueError):
            item.save()
        with self.assertRaises(ValueError):
            OrderItem.objects.filter(pk=item.pk).update(quantity=4)

        order = Order.objects.get(pk=order.pk)
        order.total = Decimal("99.00")
        with self.assertRaises(ValueError):
            order.save()

        frozen_updates = [
            {"total": Decimal("99.00")},
            {"buyer_first_name": "Grace"},
            {"buyer_last_name": "Hopper"},
            {"buyer_email": "grace@example.com"},
            {"showing": self.unapproved_event_showing},
            {"expires_at": timezone.now() + timedelta(days=2)},
        ]
        for fields in frozen_updates:
            with self.assertRaises(ValueError):
                Order.objects.filter(pk=order.pk).update(**fields)

        order.refresh_from_db()
        self.assertEqual(order.total, Decimal("15.00"))
        self.assertEqual(order.buyer_first_name, "Ada")
        self.assertEqual(order.showing_id, self.event_showing1.id)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.ticket_class_id, self.normal_class.id)

        updated = Order.objects.update_where_status(
            pk=order.pk,
            expected=Order.PENDING,
            status=Order.CANCELLED,
            decline_count=1,
        )
        self.assertEqual(updated, 1)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.CANCELLED)
        self.assertEqual(order.decline_count, 1)

        missed = Order.objects.update_where_status(
            pk=order.pk,
            expected=Order.PENDING,
            status=Order.EXPIRED,
        )
        self.assertEqual(missed, 0)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.CANCELLED)

        with self.assertRaises(ValueError):
            Order.objects.filter(pk=order.pk).update(status=Order.EXPIRED)


class OrderMigrationTests(TransactionTestCase):
    """Replay 0143 and 0147 through 0148 on the test database."""

    def setUp(self):
        super().setUp()
        if connection.vendor != "postgresql":
            self.skipTest("Migration proof runs against Postgres")

    def tearDown(self):
        self.migrate_to_latest()
        super().tearDown()

    def migrate(self, migration_name):
        self._clear_connection()
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate([("clubs", migration_name)])
        executor.loader.build_graph()
        return executor.loader.project_state([("clubs", migration_name)]).apps

    def migrate_to_latest(self):
        self._clear_connection()
        executor = MigrationExecutor(connection)
        executor.loader.build_graph()
        executor.migrate(executor.loader.graph.leaf_nodes())

    def _clear_connection(self):
        if connection.needs_rollback:
            connection.rollback()
        connection.close()

    def assert_same_schema(self, before, after):
        for key in before:
            left = set(before[key])
            right = set(after[key])
            missing = sorted(left - right)
            extra = sorted(right - left)
            self.assertEqual(
                extra,
                [],
                msg=f"{key} gained {extra[:20]}",
            )
            self.assertEqual(
                missing,
                [],
                msg=f"{key} lost {missing[:20]}",
            )

    def assert_final_order_schema(self):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT numeric_precision, numeric_scale, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'clubs_tickettransactionrecord'
                  AND column_name = 'total_amount'
                """
            )
            self.assertEqual(cursor.fetchone(), (10, 2, "NO"))

            cursor.execute(
                """
                SELECT is_nullable, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'clubs_tickettransactionrecord'
                  AND column_name = 'order_id'
                """
            )
            self.assertEqual(cursor.fetchone(), ("YES", "uuid"))

            cursor.execute(
                """
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'clubs_cart'
                  AND column_name = 'pending_transaction_uuid'
                """
            )
            self.assertEqual(cursor.fetchone(), ("YES",))

            cursor.execute(
                """
                SELECT indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname IN (
                    'unique_open_order_per_showing_owner',
                    'unique_open_order_per_showing_session'
                  )
                ORDER BY indexname
                """
            )
            indexdefs = [row[0] for row in cursor.fetchall()]
            self.assertEqual(len(indexdefs), 2, indexdefs)
            for indexdef in indexdefs:
                self.assertIn("PENDING", indexdef)
                self.assertIn("PROCESSING", indexdef)
                self.assertNotIn("NEEDS_REVIEW", indexdef)
            self.assertIn("owner_id IS NOT NULL", indexdefs[0])
            self.assertIn("owner_id IS NULL", indexdefs[1])
            self.assertNotIn("NOT NULL", indexdefs[1])

    def test_migrate_from_zero_matches_upgrade_schema(self):
        # Django built this database by migrating from zero.
        from_zero = schema_fingerprint()
        self.assert_final_order_schema()
        try:
            self.migrate("0143_split_club_reject_permission")
            self.migrate("0148_orders")
            self.assert_same_schema(from_zero, schema_fingerprint())
            self.assert_final_order_schema()

            self.migrate("0147_unique_cart_per_showing")
            self.migrate("0148_orders")
            self.assert_same_schema(from_zero, schema_fingerprint())
            self.assert_final_order_schema()
        finally:
            self.migrate_to_latest()

    def test_0143_through_0148_keeps_sold_tickets(self):
        from_zero = schema_fingerprint()
        try:
            apps = self.migrate("0143_split_club_reject_permission")
            LegacyTicket = apps.get_model("clubs", "Ticket")
            LegacyRecord = apps.get_model("clubs", "TicketTransactionRecord")

            user = get_user_model().objects.create_user(
                "sold-owner", "sold-owner@sas.upenn.edu", "test"
            )
            club = Club.objects.create(
                code="legacy-club", name="Legacy Club", description="legacy"
            )
            event = Event.objects.create(
                code="legacy-event", name="Legacy Event", club=club
            )
            showing = EventShowing.objects.create(
                event=event,
                start_time=timezone.now(),
                end_time=timezone.now() + timedelta(hours=2),
            )
            record = LegacyRecord.objects.create(
                buyer_first_name="Deleted",
                buyer_last_name="Buyer",
                buyer_email="gone@example.com",
                total_amount=Decimal("999.99"),
            )

            sold_with_owner = LegacyTicket.objects.create(
                type="general",
                price=Decimal("12.34"),
                showing_id=showing.id,
                owner_id=user.id,
            )
            # Legacy owner was SET_NULL, so a sold ticket can outlive its buyer
            # as long as the transaction record is still there.
            sold_owner_deleted = LegacyTicket.objects.create(
                type="general",
                price=Decimal("12.34"),
                showing_id=showing.id,
                owner_id=None,
                transaction_record_id=record.id,
            )
            unsold_general = 3
            for _ in range(unsold_general):
                LegacyTicket.objects.create(
                    type="general",
                    price=Decimal("12.34"),
                    showing_id=showing.id,
                )
            unsold_vip = 4
            for _ in range(unsold_vip):
                LegacyTicket.objects.create(
                    type="vip",
                    price=Decimal("20.00"),
                    showing_id=showing.id,
                )

            self.migrate("0148_orders")

            owned = Ticket.objects.get(id=sold_with_owner.id)
            self.assertEqual(owned.owner_id, user.id)
            self.assertEqual(owned.owner_email, user.email)
            self.assertEqual(owned.type, "general")

            orphan = Ticket.objects.get(id=sold_owner_deleted.id)
            self.assertIsNone(orphan.owner_id)
            self.assertEqual(orphan.transaction_record_id, record.id)
            self.assertEqual(orphan.owner_email, "gone@example.com")
            self.assertEqual(orphan.transaction_record.total_amount, Decimal("999.99"))
            self.assertIsNone(orphan.transaction_record.order_id)

            general = TicketClass.objects.get(showing_id=showing.id, name="general")
            self.assertEqual(general.quantity, unsold_general + 2)
            self.assertEqual(general.remaining, unsold_general)
            self.assertEqual(
                Ticket.objects.filter(ticket_class=general).count(),
                general.quantity - general.remaining,
            )

            vip = TicketClass.objects.get(showing_id=showing.id, name="vip")
            self.assertEqual(vip.quantity, unsold_vip)
            self.assertEqual(vip.remaining, unsold_vip)
            self.assertFalse(Ticket.objects.filter(ticket_class=vip).exists())

            self.assertFalse(
                Ticket.objects.filter(
                    ticket_class__showing_id=showing.id,
                    owner__isnull=True,
                    transaction_record__isnull=True,
                ).exists()
            )
            self.assert_same_schema(from_zero, schema_fingerprint())
            self.assert_final_order_schema()
        finally:
            self.migrate_to_latest()

    def test_0147_through_0148_keeps_carts(self):
        from_zero = schema_fingerprint()
        try:
            self.migrate("0147_unique_cart_per_showing")
            user = get_user_model().objects.create_user(
                "cart-owner", "cart-owner@sas.upenn.edu", "test"
            )
            club = Club.objects.create(
                code="cart-club", name="Cart Club", description="cart"
            )
            event = Event.objects.create(
                code="cart-event", name="Cart Event", club=club
            )
            showing = EventShowing.objects.create(
                event=event,
                start_time=timezone.now(),
                end_time=timezone.now() + timedelta(hours=2),
            )
            ticket_class = TicketClass.objects.create(
                showing=showing,
                name="general",
                price=Decimal("12.34"),
                quantity=10,
                remaining=10,
            )
            pending = uuid4()
            guest_pending = uuid4()
            cart = Cart.objects.create(
                showing=showing,
                owner=user,
                pending_transaction_uuid=pending,
            )
            item = CartItem.objects.create(
                cart=cart, ticket_class=ticket_class, quantity=2
            )
            guest_cart = Cart.objects.create(
                showing=showing,
                session_key="guest-session",
                pending_transaction_uuid=guest_pending,
            )
            guest_item = CartItem.objects.create(
                cart=guest_cart, ticket_class=ticket_class, quantity=1
            )

            self.migrate("0148_orders")

            cart.refresh_from_db()
            item.refresh_from_db()
            guest_cart.refresh_from_db()
            guest_item.refresh_from_db()
            self.assertEqual(cart.pending_transaction_uuid, pending)
            self.assertEqual(cart.owner_id, user.id)
            self.assertEqual(item.quantity, 2)
            self.assertEqual(item.ticket_class_id, ticket_class.id)
            self.assertEqual(guest_cart.pending_transaction_uuid, guest_pending)
            self.assertEqual(guest_cart.session_key, "guest-session")
            self.assertIsNone(guest_cart.owner_id)
            self.assertEqual(guest_item.quantity, 1)
            self.assertEqual(Cart.objects.count(), 2)
            self.assertEqual(CartItem.objects.count(), 2)
            self.assert_same_schema(from_zero, schema_fingerprint())
            self.assert_final_order_schema()
        finally:
            self.migrate_to_latest()
