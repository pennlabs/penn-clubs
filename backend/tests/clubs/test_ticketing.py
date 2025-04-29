import json
import uuid
from contextlib import contextmanager
from dataclasses import dataclass
from unittest.mock import patch

import freezegun
from django.contrib.auth import get_user_model
from django.core import mail
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import (
    Cart,
    Club,
    Event,
    EventShowing,
    Membership,
    Ticket,
    TicketClass,
    TicketTransactionRecord,
    TicketTransferRecord,
)


def commonSetUp(self):
    self.client = APIClient()

    self.user1 = get_user_model().objects.create_user(
        "jadams", "jadams@sas.upenn.edu", "test"
    )
    self.user1.first_name = "John"
    self.user1.last_name = "Adams"
    self.user1.is_staff = True
    self.user1.is_superuser = True
    self.user1.save()

    self.user2 = get_user_model().objects.create_user(
        "bfranklin", "bfranklin@seas.upenn.edu", "test"
    )
    self.user2.first_name = "Benjamin"
    self.user2.last_name = "Franklin"
    self.user2.save()

    self.club1 = Club.objects.create(
        code="test-club",
        name="Test Club",
        approved=True,
        email="example@example.com",
    )

    self.unapproved_club = Club.objects.create(
        code="unapproved-club",
        name="Unapproved Club",
        approved=False,
        ghost=False,
        email="example2@example.com",
    )

    self.event1 = Event.objects.create(
        code="test-event",
        club=self.club1,
        name="Test Event",
    )

    self.event_showing1 = EventShowing.objects.create(
        event=self.event1,
        start_time=timezone.now() + timezone.timedelta(days=2),
        end_time=timezone.now() + timezone.timedelta(days=3),
    )

    self.unapproved_event = Event.objects.create(
        code="unapproved-event",
        club=self.unapproved_club,
        name="Unapproved Event",
    )

    self.unapproved_event_showing = EventShowing.objects.create(
        event=self.unapproved_event,
        start_time=timezone.now() + timezone.timedelta(days=2),
        end_time=timezone.now() + timezone.timedelta(days=3),
    )

    # Create TicketClass instances instead of individual Tickets
    self.ticket_class_normal1 = TicketClass.objects.create(
        showing=self.event_showing1,
        name="normal",
        price=15.0,
        quantity=20,
        remaining=20,
    )
    self.ticket_class_premium1 = TicketClass.objects.create(
        showing=self.event_showing1,
        name="premium",
        price=30.0,
        quantity=10,
        remaining=10,
    )

    self.unapproved_ticket_class_normal = TicketClass.objects.create(
        showing=self.unapproved_event_showing,
        name="normal",
        price=15.0,
        quantity=20,
        remaining=20,
    )


class TicketEventTestCase(TestCase):
    """
    Test cases related to the methods on the ClubEventViewSet
    that correspond to the ticketing project:

    tickets (get), tickets (put), buyers, add_to_cart, remove_from_cart
    """

    def setUp(self):
        commonSetUp(self)

    def test_create_ticket_offerings(self):
        self.client.login(username=self.user1.username, password="test")

        # Test invalid ticket_drop_time editing
        resp = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            {
                "ticket_drop_time": (
                    self.event_showing1.end_time + timezone.timedelta(days=20)
                ).strftime("%Y-%m-%dT%H:%M:%S%z")
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

        # Test invalid start_time editing
        resp = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            {
                "start_time": (
                    self.event_showing1.end_time + timezone.timedelta(days=20)
                ).strftime("%Y-%m-%dT%H:%M:%S%z")
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

        # Delete existing ticket classes first to simulate creating new ones
        TicketClass.objects.filter(showing=self.event_showing1).delete()

        # Use the new ticket_types payload format
        ticket_types_payload = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {"name": "_premium", "quantity": 10, "price": 20},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            ticket_types_payload,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Assert based on TicketClass objects created
        created_ticket_classes = list(
            TicketClass.objects.filter(showing=self.event_showing1, name__contains="_")
            .values("name", "quantity", "price")
            .order_by("name")  # Ensure consistent order
        )
        expected_ticket_classes = sorted(
            ticket_types_payload["ticket_types"], key=lambda x: x["name"]
        )

        self.assertEqual(len(expected_ticket_classes), len(created_ticket_classes))
        for expected, created in zip(expected_ticket_classes, created_ticket_classes):
            self.assertEqual(expected["name"], created["name"])
            self.assertEqual(expected["quantity"], created["quantity"])
            self.assertAlmostEqual(expected["price"], float(created["price"]), 2)

    def test_create_ticket_offerings_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")

        # Delete existing ticket classes first
        TicketClass.objects.filter(showing=self.event_showing1).delete()

        # Create free ticket type payload
        ticket_types_payload = {
            "ticket_types": [
                {"name": "_free", "quantity": 10, "price": 0},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            ticket_types_payload,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Assert based on TicketClass objects created
        created_ticket_classes = list(
            TicketClass.objects.filter(showing=self.event_showing1, name__contains="_")
            .values("name", "quantity", "price")
            .order_by("name")  # Ensure consistent order
        )
        expected_ticket_classes = sorted(
            ticket_types_payload["ticket_types"], key=lambda x: x["name"]
        )

        self.assertEqual(len(expected_ticket_classes), len(created_ticket_classes))
        for expected, created in zip(expected_ticket_classes, created_ticket_classes):
            self.assertEqual(expected["name"], created["name"])
            self.assertEqual(expected["quantity"], created["quantity"])
            self.assertAlmostEqual(expected["price"], float(created["price"]), 2)

    def test_create_ticket_offerings_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")

        # Use the new ticket_types payload format
        ticket_types_payload = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {"name": "_premium", "quantity": 10, "price": 20},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            ticket_types_payload,
            format="json",
        )

        self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_ticket_offerings_bad_data(self):
        self.client.login(username=self.user1.username, password="test")

        # Delete existing ticket classes first
        TicketClass.objects.filter(showing=self.event_showing1).delete()

        bad_data = [
            {
                # Bad toplevel field
                "t1ck3t_typ3s": [
                    {"name": "_normal", "quantity": 20, "price": 10},
                    {"name": "_premium", "quantity": 10, "price": 20},
                ]
            },
            {
                "ticket_types": [
                    # Negative price
                    {"name": "_normal", "quantity": 20, "price": -10},
                    {
                        "name": "_premium",
                        "quantity": 10,
                        "price": 20,
                    },  # Only one needs to be bad
                ]
            },
            {
                "ticket_types": [
                    # Bad field members (missing required 'name' or 'quantity')
                    {"abcd": "_normal", "abcde": 20, "price": 10},
                ]
            },
            {
                "ticket_types": [
                    # Invalid group discount/size
                    {
                        "name": "_group",
                        "quantity": 10,
                        "price": 10,
                        "group_discount": 1.5,
                    },
                ]
            },
            {
                "ticket_types": [
                    # Invalid group discount/size
                    {"name": "_group", "quantity": 10, "price": 10, "group_size": 1},
                ]
            },
            {
                "ticket_types": [
                    # Missing group_size when group_discount is present
                    {
                        "name": "_group",
                        "quantity": 10,
                        "price": 10,
                        "group_discount": 0.1,
                    },
                ]
            },
        ]

        for data in bad_data:
            resp = self.client.put(
                reverse(
                    "club-events-showings-tickets",
                    args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
                ),
                data,
                format="json",
            )
            self.assertEqual(
                resp.status_code,
                400,
                f"Failed for data: {data} - Response: {resp.content}",
            )
            # Check that no ticket classes were created
            self.assertEqual(
                TicketClass.objects.filter(
                    showing=self.event_showing1, name__contains="_"
                ).count(),
                0,
                f"Ticket classes were created for bad data: {data}",
            )

    def test_create_ticket_offerings_delay_drop(self):
        self.client.login(username=self.user1.username, password="test")

        # Delete existing ticket classes first
        TicketClass.objects.filter(showing=self.event_showing1).delete()

        # Use the new ticket_types payload format and add drop_time
        args = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {"name": "_premium", "quantity": 10, "price": 20},
            ],
            "drop_time": (timezone.now() + timezone.timedelta(hours=12)).strftime(
                "%Y-%m-%dT%H:%M:%S%z"
            ),
        }
        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.event_showing1.refresh_from_db()

        # Drop time should be set
        self.assertIsNotNone(self.event_showing1.ticket_drop_time)

        # Drop time should be ~12 hours from initial ticket creation
        expected_drop_time = timezone.now() + timezone.timedelta(hours=12)
        diff = abs(self.event_showing1.ticket_drop_time - expected_drop_time)
        self.assertTrue(diff < timezone.timedelta(minutes=5))  # Allow some flexibility

        # Move Django's internal clock 13 hours forward
        with freezegun.freeze_time(timezone.now() + timezone.timedelta(hours=13)):
            # Attempt to edit tickets after drop time
            resp_edit = self.client.put(
                reverse(
                    "club-events-showings-tickets",
                    args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
                ),
                args,  # Using the same args payload
                format="json",
            )

            # Tickets shouldn't be editable after drop time has elapsed
            self.assertEqual(resp_edit.status_code, 403, resp_edit.content)
            self.assertIn(
                "Tickets cannot be edited after they have dropped",
                str(resp_edit.content),
            )

    def test_create_ticket_offerings_already_owned(self):
        self.client.login(username=self.user1.username, password="test")

        # Create initial ticket classes (replacing setup ones for clarity)
        TicketClass.objects.filter(showing=self.event_showing1).delete()
        tc_normal = TicketClass.objects.create(
            showing=self.event_showing1,
            name="_normal",
            quantity=5,
            remaining=5,
            price=10,
        )
        TicketClass.objects.create(
            showing=self.event_showing1,
            name="_premium",
            quantity=3,
            remaining=3,
            price=20,
        )

        # Simulate purchase by creating a Ticket instance and assigning an owner
        # Need a transaction record first
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-{uuid.uuid4().hex[:8]}",
            total_amount=tc_normal.price,
            buyer_first_name=self.user2.first_name,
            buyer_last_name=self.user2.last_name,
            buyer_email=self.user2.email,
        )
        Ticket.objects.create(
            ticket_class=tc_normal,
            owner=self.user2,
            transaction_record=transaction_record,
            owner_email=self.user2.email,  # Set owner_email
        )
        tc_normal.remaining -= 1  # Manually update remaining count
        tc_normal.save()

        # Attempt to recreate/update ticket classes via PUT should fail
        args_update = {
            "ticket_types": [
                {
                    "name": "_normal",
                    "quantity": 6,
                    "price": 12,
                },  # Change quantity/price
                {"name": "_premium", "quantity": 3, "price": 20},
            ],
        }
        resp_put = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args_update,
            format="json",
        )
        self.assertEqual(resp_put.status_code, 403, resp_put.content)
        self.assertIn(
            "Tickets cannot be edited after they have been sold", str(resp_put.content)
        )

        # Changing ticket drop time via PATCH should also fail if tickets exist
        resp_patch = self.client.patch(
            reverse(
                "club-events-showings-detail",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            {
                "ticket_drop_time": (
                    timezone.now() + timezone.timedelta(hours=12)
                ).strftime("%Y-%m-%dT%H:%M:%S%z")
            },
            format="json",
        )
        # Since we created a ticket instance with an owner, this should fail.
        self.assertEqual(resp_patch.status_code, 400, resp_patch.content)
        self.assertIn(
            "Ticket drop times cannot be edited after tickets have been sold or held",
            str(resp_patch.content),
        )

    def test_issue_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                # Use the names from TicketClass setup
                {
                    "username": self.user1.username,
                    "ticket_type": self.ticket_class_normal1.name,
                    "quantity": 1,
                },
                {
                    "username": self.user1.username,
                    "ticket_type": self.ticket_class_premium1.name,
                    "quantity": 1,
                },
                {
                    "username": self.user2.username,
                    "ticket_type": self.ticket_class_normal1.name,
                    "quantity": 1,
                },
                # Test issuing by email for a guest (no username)
                {
                    "email": "guest@example.com",
                    "ticket_type": self.ticket_class_premium1.name,
                    "quantity": 1,
                },
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-issue-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )

        # Expect 201 CREATED now
        self.assertEqual(resp.status_code, 201, resp.content)

        # Check tickets created for registered users
        for item in args["tickets"]:
            ticket_type = item["ticket_type"]
            quantity = item.get("quantity", 1)  # Default to 1 if not specified

            if "username" in item:
                username = item["username"]
                user = get_user_model().objects.get(username=username)
                self.assertEqual(
                    Ticket.objects.filter(
                        ticket_class__name=ticket_type,
                        ticket_class__showing=self.event_showing1,
                        owner=user,
                        transaction_record__total_amount=0.0,  # Admin issued are free
                    )
                    .select_related("transaction_record", "ticket_class")
                    .count(),
                    quantity,
                    f"Failed for user {username}, type {ticket_type}",
                )
            elif "email" in item:
                email = item["email"]
                self.assertEqual(
                    Ticket.objects.filter(
                        ticket_class__name=ticket_type,
                        ticket_class__showing=self.event_showing1,
                        owner__isnull=True,  # Guest user
                        owner_email=email,
                        transaction_record__total_amount=0.0,  # Admin issued are free
                    )
                    .select_related("transaction_record", "ticket_class")
                    .count(),
                    quantity,
                    f"Failed for guest email {email}, type {ticket_type}",
                )

        # Check inventory was reduced
        self.ticket_class_normal1.refresh_from_db()
        self.ticket_class_premium1.refresh_from_db()
        self.assertEqual(
            self.ticket_class_normal1.remaining, self.ticket_class_normal1.quantity - 2
        )  # 2 normal issued
        self.assertEqual(
            self.ticket_class_premium1.remaining,
            self.ticket_class_premium1.quantity - 2,
        )  # 2 premium issued

    def test_issue_tickets_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        args = {
            "tickets": [
                # Use names from TicketClass setup
                {
                    "username": self.user1.username,
                    "ticket_type": self.ticket_class_normal1.name,
                },
                {
                    "username": self.user2.username,
                    "ticket_type": self.ticket_class_normal1.name,
                },
            ]
        }

        resp = self.client.post(
            reverse(
                "club-events-showings-issue-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )

        self.assertEqual(resp.status_code, 403, resp.content)

    def test_issue_tickets_invalid_username_ticket_type(self):
        # Test invalid usernames
        self.client.login(username=self.user1.username, password="test")
        args_invalid_user = {
            "tickets": [
                {
                    "username": "invalid_user_1",
                    "ticket_type": self.ticket_class_normal1.name,
                },
                {
                    "username": "invalid_user_2",
                    "ticket_type": self.ticket_class_premium1.name,
                },
            ]
        }
        resp_invalid_user = self.client.post(
            reverse(
                "club-events-showings-issue-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args_invalid_user,
            format="json",
        )

        self.assertEqual(resp_invalid_user.status_code, 400, resp_invalid_user.content)
        data_invalid_user = resp_invalid_user.json()
        self.assertIn("Validation failed", data_invalid_user["detail"])
        self.assertIn("User invalid_user_1 not found", data_invalid_user["errors"])
        self.assertIn("User invalid_user_2 not found", data_invalid_user["errors"])

        # Test invalid ticket types
        args_invalid_type = {
            "tickets": [
                {"username": self.user2.username, "ticket_type": "invalid_type_1"},
                {"username": self.user2.username, "ticket_type": "invalid_type_2"},
            ]
        }
        resp_invalid_type = self.client.post(
            reverse(
                "club-events-showings-issue-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args_invalid_type,
            format="json",
        )

        self.assertEqual(resp_invalid_type.status_code, 400, resp_invalid_type.content)
        data_invalid_type = resp_invalid_type.json()
        self.assertIn("Validation failed", data_invalid_type["detail"])
        self.assertIn(
            "Ticket type 'invalid_type_1' not found", data_invalid_type["errors"]
        )
        self.assertIn(
            "Ticket type 'invalid_type_2' not found", data_invalid_type["errors"]
        )

    def test_issue_tickets_insufficient_quantity(self):
        self.client.login(username=self.user1.username, password="test")
        # Request more tickets than available for the 'normal' class
        insufficient_quantity = self.ticket_class_normal1.quantity + 1
        args = {
            "tickets": [
                {
                    "username": self.user2.username,
                    "ticket_type": self.ticket_class_normal1.name,
                    "quantity": insufficient_quantity,
                }
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-issue-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )

        self.assertEqual(resp.status_code, 400, resp.content)
        data = resp.json()
        self.assertIn("Validation failed", data["detail"])
        # Check for the specific inventory error message format
        expected_error = (
            f"Not enough inventory for '{self.ticket_class_normal1.name}': "
            f"requested {insufficient_quantity}, but only "
            f"{self.ticket_class_normal1.remaining} available"
        )
        self.assertIn(expected_error, data["errors"])

        # No tickets should be transferred/created
        self.assertEqual(
            Ticket.objects.filter(
                owner=self.user2, ticket_class=self.ticket_class_normal1
            ).count(),
            0,
        )

        # Inventory should remain unchanged
        self.ticket_class_normal1.refresh_from_db()
        self.assertEqual(
            self.ticket_class_normal1.remaining, self.ticket_class_normal1.quantity
        )

    def test_email_blast(self):
        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user1.username, password="test")

        # Create a transaction record and a ticket instance owned by user2
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-BLAST-{uuid.uuid4().hex[:8]}",
            total_amount=0,  # Irrelevant for this test
            buyer_first_name=self.user2.first_name,
            buyer_last_name=self.user2.last_name,
            buyer_email=self.user2.email,
        )
        Ticket.objects.create(
            ticket_class=self.ticket_class_normal1,
            owner=self.user2,
            transaction_record=transaction_record,
            owner_email=self.user2.email,  # Explicitly set owner_email
        )

        resp = self.client.post(
            reverse(
                "club-events-showings-email-blast",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            {"content": "Test email blast content"},
            format="json",
        )

        self.assertEqual(resp.status_code, 200, resp.content)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        self.assertIn(self.user2.email, email.to)
        self.assertIn(self.user1.email, email.to)

        self.assertEqual(
            email.subject, f"Update on {self.event1.name} from {self.club1.name}"
        )
        self.assertIn("Test email blast content", email.body)

    def test_email_blast_empty_content(self):
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.post(
            reverse(
                "club-events-showings-email-blast",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            {"content": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_get_tickets_information_no_tickets(self):
        # Delete all ticket classes for this showing
        TicketClass.objects.filter(showing=self.event_showing1).delete()

        resp = self.client.get(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        # Expect an empty list for ticket_types
        self.assertEqual(data.get("ticket_types"), [], data)

    def test_get_tickets_information(self):
        # Simulate buying all normal tickets
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-GETINFO-{uuid.uuid4().hex[:8]}",
            total_amount=self.ticket_class_normal1.price
            * self.ticket_class_normal1.quantity,
            buyer_first_name=self.user1.first_name,
            buyer_last_name=self.user1.last_name,
            buyer_email=self.user1.email,
        )
        for _ in range(self.ticket_class_normal1.quantity):
            Ticket.objects.create(
                ticket_class=self.ticket_class_normal1,
                owner=self.user1,
                transaction_record=transaction_record,
                owner_email=self.user1.email,
            )

        # Manually update remaining count for the ticket class
        self.ticket_class_normal1.remaining = 0
        self.ticket_class_normal1.save()

        resp = self.client.get(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()

        # Find the normal and premium ticket types in the response
        normal_info = next(
            (tc for tc in data["ticket_types"] if tc["name"] == "normal"), None
        )
        premium_info = next(
            (tc for tc in data["ticket_types"] if tc["name"] == "premium"), None
        )

        self.assertIsNotNone(normal_info, "Normal ticket type not found in response")
        self.assertIsNotNone(premium_info, "Premium ticket type not found in response")

        # Check normal tickets (all sold)
        self.assertEqual(normal_info["remaining"], 0)
        self.assertAlmostEqual(
            normal_info["price"], float(self.ticket_class_normal1.price), 2
        )

        # Check premium tickets (all available)
        self.assertEqual(premium_info["remaining"], self.ticket_class_premium1.quantity)
        self.assertAlmostEqual(
            premium_info["price"], float(self.ticket_class_premium1.price), 2
        )

    def test_get_tickets_buyers(self):
        self.client.login(username=self.user1.username, password="test")

        # Simulate buying some normal tickets with user1
        num_tickets_to_buy = 5
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-BUYERS-{uuid.uuid4().hex[:8]}",
            total_amount=self.ticket_class_normal1.price * num_tickets_to_buy,
            buyer_first_name=self.user1.first_name,
            buyer_last_name=self.user1.last_name,
            buyer_email=self.user1.email,
        )
        bought_ticket_ids = set()
        for _ in range(num_tickets_to_buy):
            ticket = Ticket.objects.create(
                ticket_class=self.ticket_class_normal1,
                owner=self.user1,
                transaction_record=transaction_record,
                owner_email=self.user1.email,
            )
            bought_ticket_ids.add(str(ticket.id))

        # Manually update remaining count
        self.ticket_class_normal1.remaining -= num_tickets_to_buy
        self.ticket_class_normal1.save()

        resp = self.client.get(
            reverse(
                "club-events-showings-buyers",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        data = resp.json()
        self.assertIn("buyers", data)
        self.assertEqual(len(data["buyers"]), num_tickets_to_buy)

        # Assert ownership correctly determined
        returned_ids = set()
        for buyer_info in data["buyers"]:
            self.assertEqual(buyer_info["owner_id"], self.user1.id)
            self.assertEqual(buyer_info["ticket_type"], self.ticket_class_normal1.name)
            self.assertEqual(buyer_info["email"], self.user1.email)
            returned_ids.add(buyer_info["id"])

        # Ensure the correct tickets were returned
        self.assertEqual(bought_ticket_ids, returned_ids)

    def test_get_tickets_buyers_bad_perms(self):
        # Simulate buying some tickets first
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-BUYERS-PERM-{uuid.uuid4().hex[:8]}",
            total_amount=0,
            buyer_first_name="Test",
            buyer_last_name="Buyer",
            buyer_email="t@b.com",
        )
        Ticket.objects.create(
            ticket_class=self.ticket_class_normal1,
            owner=self.user1,  # Assign an owner
            transaction_record=transaction_record,
            owner_email=self.user1.email,
        )
        self.ticket_class_normal1.remaining -= 1
        self.ticket_class_normal1.save()

        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")

        resp = self.client.get(
            reverse(
                "club-events-showings-buyers",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )

        self.assertEqual(resp.status_code, 403, resp)

    def test_add_to_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Payload using ticket_class_id
        payload = {
            "quantities": [
                {"ticket_class_id": self.ticket_class_normal1.id, "quantity": 2},
                {"ticket_class_id": self.ticket_class_premium1.id, "quantity": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIsNotNone(data.get("cart_id"))
        cart_id = data["cart_id"]

        # Verify CartItem objects
        cart = Cart.objects.get(id=cart_id)
        self.assertEqual(cart.owner, self.user1)
        self.assertEqual(cart.items.count(), 2)

        item_normal = cart.items.get(ticket_class=self.ticket_class_normal1)
        item_premium = cart.items.get(ticket_class=self.ticket_class_premium1)

        self.assertEqual(item_normal.quantity, 2)
        self.assertEqual(item_premium.quantity, 1)

    def test_add_to_cart_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")

        # Set the event end time to the past
        self.event_showing1.end_time = timezone.now() - timezone.timedelta(days=1)
        self.event_showing1.save()

        payload = {
            "quantities": [
                {"ticket_class_id": self.ticket_class_normal1.id, "quantity": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            payload,
            format="json",
        )

        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("This showing has already ended", resp.data["detail"], resp.data)
        self.assertFalse(resp.data.get("success"))

    def test_add_to_cart_order_limit_exceeded(self):
        self.client.login(username=self.user1.username, password="test")

        # Set a low order limit for the showing
        self.event_showing1.ticket_order_limit = 2
        self.event_showing1.save()

        payload = {
            "quantities": [
                {
                    "ticket_class_id": self.ticket_class_normal1.id,
                    "quantity": 3,
                },  # Exceeds limit
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertFalse(resp.data.get("success"))
        self.assertIn(
            "Order exceeds the maximum ticket limit of "
            f"{self.event_showing1.ticket_order_limit}.",
            resp.data["detail"],
            resp.data,
        )

    def test_add_to_cart_tickets_unavailable(self):
        self.client.login(username=self.user1.username, password="test")

        # Reduce remaining tickets for the normal class
        self.ticket_class_normal1.remaining = 1
        self.ticket_class_normal1.save()

        # Try to add two tickets
        payload = {
            "quantities": [
                {"ticket_class_id": self.ticket_class_normal1.id, "quantity": 2},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.data)
        self.assertFalse(resp.data.get("success"))
        self.assertIn(
            f"Not enough tickets of type {self.ticket_class_normal1.name} left!",
            resp.data["detail"],
            resp.data,
        )

    def test_add_to_cart_before_ticket_drop(self):
        self.client.login(username=self.user1.username, password="test")

        # Set drop time in the future
        self.event_showing1.ticket_drop_time = timezone.now() + timezone.timedelta(
            hours=12
        )
        self.event_showing1.save()

        payload = {
            "quantities": [
                {"ticket_class_id": self.ticket_class_normal1.id, "quantity": 2},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            payload,
            format="json",
        )

        # Tickets should not be added to cart before drop time
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertFalse(resp.data.get("success"))
        self.assertIn(
            "Ticket drop time has not yet elapsed", resp.data["detail"], resp.data
        )

    def test_add_to_cart_unapproved_club(self):
        self.client.login(username=self.user1.username, password="test")
        payload = {
            "quantities": [
                {
                    "ticket_class_id": self.unapproved_ticket_class_normal.id,
                    "quantity": 2,
                },
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(
                    self.unapproved_club.code,
                    self.unapproved_event.pk,
                    self.unapproved_event_showing.pk,
                ),
            ),
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)  # Club not approved
        self.assertFalse(resp.data.get("success"))
        self.client.login(username=self.user2.username, password="test")
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(
                    self.unapproved_club.code,
                    self.unapproved_event.pk,
                    self.unapproved_event_showing.pk,
                ),
            ),
            payload,
            format="json",
        )
        # Non-officer/superuser cannot see unapproved/ghost club event
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_add_to_cart_nonexistent_club(self):
        payload = {
            "quantities": [
                # Use a valid ticket class ID from an existing showing for this part
                {"ticket_class_id": self.ticket_class_normal1.id, "quantity": 2},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(
                    "Random club name",
                    self.event1.pk,  # Use valid event pk
                    self.event_showing1.pk,  # Use valid showing pk
                ),
            ),
            payload,
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)  # Club not found

    def test_delete_event_with_claimed_tickets(self):
        # Simulate purchase (create a ticket instance)
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-DELETE-{uuid.uuid4().hex[:8]}",
            total_amount=0,
            buyer_first_name="Test",
            buyer_last_name="User",
            buyer_email="t@u.com",
        )
        Ticket.objects.create(
            ticket_class=self.ticket_class_normal1,
            owner=self.user1,
            transaction_record=transaction_record,
            owner_email=self.user1.email,
        )
        self.ticket_class_normal1.remaining -= 1
        self.ticket_class_normal1.save()

        self.client.login(username=self.user1.username, password="test")

        # Try deleting showing - should fail due to owned ticket
        resp_showing_delete = self.client.delete(
            reverse(
                "club-events-showings-detail",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            )
        )
        self.assertEqual(
            resp_showing_delete.status_code, 400, resp_showing_delete.content
        )

        # Try deleting parent event - should also fail due to owned ticket in showing
        resp_event_delete = self.client.delete(
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk))
        )
        self.assertEqual(resp_event_delete.status_code, 400, resp_event_delete.content)


@dataclass
class MockPaymentResponse:
    status: str = "AUTHORIZED"
    reconciliation_id: str = "abced"


@contextmanager
def mock_cybersource_apis():
    """Mock cybersource APIs and validate_transient_token"""
    with (
        patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context,
        patch(
            ".".join(
                [
                    "CyberSource",
                    "TransientTokenDataApi",
                    "get_transaction_for_transient_token",
                ]
            )
        ) as fake_get_transaction,
        patch(
            ".".join(
                [
                    "CyberSource",
                    "PaymentsApi",
                    "create_payment",
                ]
            )
        ) as fake_create_payment,
        patch("clubs.views.validate_transient_token") as fake_validate_tt,
    ):
        fake_validate_tt.return_value = (True, "")
        fake_cap_context.return_value = "abcde", 200, None
        fake_get_transaction.return_value = (
            "",
            200,
            json.dumps(
                {
                    "orderInformation": {
                        "amountDetails": {
                            "totalAmount": 20,
                        },
                        "billTo": {
                            "firstName": "Rohan",
                            "lastName": "Gupta",
                            "phoneNumber": "3021239234",
                            "email": "r@g.com",
                        },
                    }
                }
            ),
        )
        fake_create_payment.return_value = MockPaymentResponse(), 200, ""
        yield (
            fake_cap_context,
            fake_get_transaction,
            fake_create_payment,
            fake_validate_tt,
        )


class TicketTestCase(TestCase):
    """
    Test cases related to the methods on the TicketViewSet
    that correspond to the ticketing project:

    get, list, initiate_checkout, complete_checkout
    """

    def setUp(self):
        commonSetUp(self)

    def test_get_ticket_owned_by_me(self):
        self.client.login(username=self.user1.username, password="test")

        # Create a transaction record and ticket instance first
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-GETTICKET-{uuid.uuid4().hex[:8]}",
            total_amount=0,
            buyer_first_name="Test",
            buyer_last_name="User",
            buyer_email="t@u.com",
        )
        ticket_instance = Ticket.objects.create(
            ticket_class=self.ticket_class_normal1,
            transaction_record=transaction_record,
            # No owner initially
            owner_email="t@u.com",
        )

        # Fail to get when not owned by logged-in user
        resp = self.client.get(
            reverse("tickets-detail", args=(ticket_instance.id,)), format="json"
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        # Succeed when owned
        ticket_instance.owner = self.user1
        ticket_instance.owner_email = self.user1.email  # Update owner email too
        ticket_instance.save()

        resp = self.client.get(
            reverse("tickets-detail", args=(ticket_instance.id,)), format="json"
        )
        data = resp.json()
        self.assertEqual(resp.status_code, 200, resp.content)

        # Test the serializer API fields (based on TicketSerializer)
        expected_fields = [
            "id",
            "event",
            "ticket_type",
            "owner",
            "attended",
            "price",
            "owner_email",
            "created_at",
            "updated_at",
        ]
        for field in expected_fields:
            self.assertIn(field, data, f"Field '{field}' missing in response: {data}")

        self.assertEqual(data["id"], str(ticket_instance.id))
        self.assertEqual(data["ticket_type"], self.ticket_class_normal1.name)
        self.assertEqual(data["owner"], self.user1.get_full_name())

    def test_list_tickets_owned_by_me(self):
        self.client.login(username=self.user1.username, password="test")

        # Check empty list when no tickets are owned
        resp = self.client.get(reverse("tickets-list"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json(), [], resp.content)

        # Create 5 tickets owned by user1
        num_tickets = 5
        transaction_record = TicketTransactionRecord.objects.create(
            reconciliation_id=f"TEST-LISTTICKETS-{uuid.uuid4().hex[:8]}",
            total_amount=0,
            buyer_first_name=self.user1.first_name,
            buyer_last_name=self.user1.last_name,
            buyer_email=self.user1.email,
        )
        created_ticket_ids = set()
        for i in range(num_tickets):
            # Use both ticket classes for variety
            ticket_class = (
                self.ticket_class_normal1 if i % 2 == 0 else self.ticket_class_premium1
            )
            ticket = Ticket.objects.create(
                ticket_class=ticket_class,
                owner=self.user1,
                transaction_record=transaction_record,
                owner_email=self.user1.email,
            )
            created_ticket_ids.add(str(ticket.id))

        resp = self.client.get(reverse("tickets-list"), format="json")
        data = resp.json()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(data), num_tickets, data)

        # Verify the IDs of the returned tickets match those created
        returned_ids = set(t["id"] for t in data)
        self.assertEqual(created_ticket_ids, returned_ids)

    def test_get_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        resp = self.client.get(reverse("tickets-cart"), format="json")
        data = resp.json()

        # None are sold out
        self.assertEqual(len(data["tickets"]), 5, data)
        for t1, t2 in zip(data["tickets"], tickets_to_add):
            self.assertEqual(t1["id"], str(t2.id))
        self.assertEqual(len(data["sold_out"]), 0, data)

    def test_calculate_cart_total(self):
        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        expected_total = sum(t.price for t in tickets_to_add)

        from clubs.views import TicketViewSet

        actual_total = TicketViewSet._calculate_cart_total(cart)
        self.assertEqual(actual_total, expected_total)

    def test_calculate_cart_total_with_group_discount(self):
        # Create tickets with group discount
        tickets = [
            Ticket.objects.create(
                type="group",
                showing=self.event_showing1,
                price=10.0,
                group_size=2,
                group_discount=0.2,
            )
            for _ in range(10)
        ]

        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        from clubs.views import TicketViewSet

        # Add 1 ticket, shouldn't activate group discount
        cart.tickets.add(tickets[0])
        cart.save()

        total = TicketViewSet._calculate_cart_total(cart)
        self.assertEqual(total, 10.0)  # 1 * price=10 = 10

        # Add 4 more tickets, enough to activate group discount
        tickets_to_add = tickets[1:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        self.assertEqual(cart.tickets.count(), 5)

        total = TicketViewSet._calculate_cart_total(cart)
        self.assertEqual(total, 40.0)  # 5 * price=10 * (1 - group_discount=0.2) = 40

    def test_get_cart_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # Set the event end time to the past
        self.event_showing1.end_time = timezone.now() - timezone.timedelta(days=1)
        self.event_showing1.save()

        resp = self.client.get(reverse("tickets-cart"), format="json")
        data = resp.json()

        # The cart should now be empty
        self.assertEqual(len(data["tickets"]), 0, data)

        # All tickets should be in the sold out array
        self.assertEqual(len(data["sold_out"]), 1, data)

        expected_sold_out = {
            "type": tickets_to_add[0].type,
            "showing": {
                "id": tickets_to_add[0].showing.id,
            },
            "event": {
                "id": self.event1.id,
                "name": self.event1.name,
            },
            "count": 5,
        }
        for key, val in expected_sold_out.items():
            self.assertEqual(data["sold_out"][0][key], val, data)

    def test_give_tickets(self):
        from clubs.views import TicketViewSet

        self.client.login(username=self.user1.username, password="test")
        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:3]
        cart.tickets.add(*tickets_to_add)
        cart.save()

        order_info = {
            "amountDetails": {"totalAmount": TicketViewSet._calculate_cart_total(cart)},
            "billTo": {
                "firstName": self.user1.first_name,
                "lastName": self.user1.last_name,
                "phoneNumber": "3021239234",
                "email": self.user1.email,
            },
        }

        TicketViewSet._place_hold_on_tickets(self.user1, cart.tickets)
        TicketViewSet._give_tickets(
            self.user1,
            order_info,
            cart,
            reconciliation_id=MockPaymentResponse().reconciliation_id,
        )

        # Check that tickets are assigned their owner
        for ticket in cart.tickets.all():
            self.assertEqual(self.user1, ticket.owner)
            self.assertIsNone(ticket.holder)

        # Check that the cart is empty
        self.assertEqual(0, cart.tickets.count())

        # Check that transaction record is created
        record_exists = TicketTransactionRecord.objects.filter(
            reconciliation_id=MockPaymentResponse().reconciliation_id
        ).exists()
        self.assertTrue(record_exists)

        # Check that confirmation emails were sent
        self.assertEqual(len(mail.outbox), len(tickets_to_add))
        for msg in mail.outbox:
            self.assertIn(
                f"Ticket confirmation for {self.user1.first_name} "
                f"{self.user1.last_name}",
                msg.subject,
            )
            self.assertIn(self.user1.first_name, msg.body)
            self.assertIn(self.event1.name, msg.body)
            self.assertIsNotNone(msg.attachments)

    # TODO: update once we decide between Unified Checkout and Secure Acceptance
    """
    def test_initiate_checkout_non_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Initiate checkout
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            cap_context_data = "abcde"
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            # No free tickets should be sold
            self.assertFalse(resp.data["sold_free_tickets"])

        # Capture context should be tied to cart
        cart = Cart.objects.filter(owner=self.user1).first()
        self.assertIsNotNone(cart.checkout_context)
        self.assertEqual(cart.checkout_context, cap_context_data)

        # Tickets should be held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 2, held_tickets)
        self.assertEqual(held_tickets.filter(type="normal").count(), 1, held_tickets)
        self.assertEqual(held_tickets.filter(type="premium").count(), 1, held_tickets)

    def test_initiate_checkout_free_and_non_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        Ticket.objects.create(type="free", showing=self.event_showing1, price=0.0)

        # Add a few tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "free", "count": 1},
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Initiate checkout
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            cap_context_data = "abcde"
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            # Free ticket should be sold with non-free tickets if purchased together
            self.assertFalse(resp.data["sold_free_tickets"])

        # Capture context should be tied to cart
        cart = Cart.objects.filter(owner=self.user1).first()
        self.assertIsNotNone(cart.checkout_context)
        self.assertEqual(cart.checkout_context, cap_context_data)

        # Tickets should be held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 3, held_tickets)
        self.assertEqual(held_tickets.filter(type="free").count(), 1, held_tickets)
        self.assertEqual(held_tickets.filter(type="normal").count(), 1, held_tickets)
        self.assertEqual(held_tickets.filter(type="premium").count(), 1, held_tickets)

    def test_initiate_checkout_only_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")

        tickets = [
            Ticket(type="free", showing=self.event_showing1, price=0.0)
            for _ in range(3)
        ]
        Ticket.objects.bulk_create(tickets)

        # Add a few free tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "free", "count": 3},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Initiate checkout
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            cap_context_data = "abcde"
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            # check that free tickets were sold
            self.assertTrue(resp.data["sold_free_tickets"])

        # Ownership transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 3, owned_tickets)

        # Cart empty
        user_cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(user_cart.tickets.count(), 0, user_cart)

        # Tickets held is 0
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 0, held_tickets)

        # Check that transaction record is created
        record_exists = TicketTransactionRecord.objects.filter(
            reconciliation_id="None"
        ).exists()
        self.assertTrue(record_exists)

    def test_initiate_checkout_after_ticket_drop_time_edit(self):
        self.client.login(username=self.user1.username, password="test")

        tickets = [
            Ticket(type="free", showing=self.event_showing1, price=0.0)
            for _ in range(3)
        ]
        Ticket.objects.bulk_create(tickets)

        # Add a few free tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "free", "count": 3},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Set drop time ahead of current time
        self.event_showing1.ticket_drop_time = timezone.now() + timezone.timedelta(
            hours=12
        )
        self.event_showing1.save()

        # Initiate checkout
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            cap_context_data = "abcde"
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            # Ticket should not be checked out
            self.assertEqual(resp.status_code, 403, resp.content)

    def test_initiate_concurrent_checkouts(self):
        self.client.login(username=self.user1.username, password="test")

        # Add tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Initiate first checkout
        cap_context_data = "abc"
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)

        cart = Cart.objects.filter(owner=self.user1).first()
        cap_context_1 = cart.checkout_context

        # Initiate second checkout
        cap_context_data = "def"  # simulate capture context changing between checkouts
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            fake_cap_context.return_value = cap_context_data, 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)

        cart = Cart.objects.filter(owner=self.user1).first()
        cap_context_2 = cart.checkout_context

        # Stored capture context should change between checkouts
        self.assertNotEqual(cap_context_1, cap_context_2)

    def test_initiate_checkout_fails_with_empty_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Assert non existent cart
        cart, created = Cart.objects.get_or_create(owner=self.user1)
        self.assertTrue(created)

        # Initiate checkout, fail with 400
        # NOTE: If the cart does not exist, we will have a 404
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            fake_cap_context.return_value = "abcde", 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertEqual(resp.status_code, 400, resp.content)

        # Tickets are not held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertFalse(held_tickets.exists())

    def test_initiate_checkout_stale_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # In the meantime, someone snipes a ticket we added by holding
        sniped_ticket = self.ticket_class_normal1
        sniped_ticket.holder = self.user2
        sniped_ticket.save()

        # Initiate checkout for the first time
        with patch(
            ".".join(
                [
                    "CyberSource",
                    "UnifiedCheckoutCaptureContextApi",
                    "generate_unified_checkout_capture_context_with_http_info",
                ]
            )
        ) as fake_cap_context:
            fake_cap_context.return_value = "abcde", 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertEqual(resp.status_code, 403, resp.content)
            self.assertIn("Cart is stale", resp.data["detail"], resp.data)

            # Tickets are not held
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)

            # Ok, so now we call /api/tickets/cart to refresh
            resp = self.client.get(reverse("tickets-cart"), format="json")

            # Initiate checkout again...this should work
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)

            # Tickets are held
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertNotIn(sniped_ticket, held_tickets, held_tickets)
            self.assertEqual(held_tickets.count(), 5, held_tickets)

    def test_complete_checkout(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        with mock_cybersource_apis():
            # Initiate checkout
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 2, held_tickets)

            # Complete checkout
            resp = self.client.post(
                reverse("tickets-complete-checkout"),
                {"transient_token": "abcdefg"},
                format="json",
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)
            self.assertIn("Payment successful", resp.data["detail"], resp.data)

            # Ownership transferred
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 2, owned_tickets)

            # Cart empty
            user_cart = Cart.objects.get(owner=self.user1)
            self.assertEqual(user_cart.tickets.count(), 0, user_cart)

            # Tickets held is 0
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)

            # Check that transaction record is created
            record_exists = TicketTransactionRecord.objects.filter(
                reconciliation_id=MockPaymentResponse().reconciliation_id
            ).exists()
            self.assertTrue(record_exists)

    def test_complete_checkout_stale_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        with mock_cybersource_apis():
            # Initiate checkout
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 2, held_tickets)

            # Make holds expire prematurely, creating a stale cart
            for ticket in held_tickets:
                ticket.holding_expiration = timezone.now() - timedelta(minutes=1)
                ticket.save()

            # Invoking this API endpoint causes all holds to be expired
            resp = self.client.post(
                reverse("tickets-complete-checkout"),
                {"transient_token": "abcdefg"},
                format="json",
            )
            self.assertEqual(resp.status_code, 403, resp.content)
            self.assertIn("Cart is stale", resp.data["detail"], resp.content)

            # Ownership not transferred
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 0, owned_tickets)

    def test_complete_checkout_validate_token_fails(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        with mock_cybersource_apis() as (_, _, _, fake_validate_token):
            # Initiate checkout
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 2, held_tickets)

            fake_validate_token.return_value = (False, "Validation failed")

            # Try to complete
            resp = self.client.post(
                reverse("tickets-complete-checkout"),
                {"transient_token": "abcdefg"},
                format="json",
            )

            # Fails because token validation failed
            self.assertEqual(resp.status_code, 500, resp.content)
            self.assertIn("Validation failed", resp.data["detail"], resp.content)

            # Ownership not transferred
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 0, owned_tickets)

            # Hold cancelled
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)

    def test_complete_checkout_cybersource_fails(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = Ticket.objects.filter(type="normal")[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        with mock_cybersource_apis() as (_, fake_create_payment, _, _):
            # Initiate checkout
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 2, held_tickets)

            fake_create_payment.return_value = (
                MockPaymentResponse(status="UNAUTHORIZED"),
                400,
                "",
            )

            # Try to complete
            resp = self.client.post(
                reverse("tickets-complete-checkout"),
                {"transient_token": "abcdefg"},
                format="json",
            )

            # Fails because cybersource fails
            self.assertEqual(resp.status_code, 500, resp.content)
            self.assertIn("Transaction failed", resp.data["detail"], resp.content)
            self.assertIn("HTTP status 400", resp.data["detail"], resp.content)

            # Ownership not transferred
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 0, owned_tickets)

            # Hold cancelled
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)
    """

    def test_transfer_ticket(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = self.ticket_class_normal1

        # fail to transfer when not owned
        resp = self.client.post(
            reverse("tickets-transfer", args=(ticket.id,)),
            {"username": self.user2.username},
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        ticket.owner = self.user1
        ticket.save()

        # successful transfer when owned
        resp = self.client.post(
            reverse("tickets-transfer", args=(ticket.id,)),
            {"username": self.user2.username},
            format="json",
        )
        ticket.refresh_from_db()

        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(ticket.owner, self.user2, ticket.owner)

    def test_transfer_non_transferable_ticket(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = self.ticket_class_normal1
        ticket.owner = self.user1
        ticket.transferable = False
        ticket.save()

        resp = self.client.post(
            reverse("tickets-transfer", args=(ticket.id,)),
            {"username": self.user2.username},
            format="json",
        )
        ticket.refresh_from_db()

        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertEqual(ticket.owner, self.user1, ticket.owner)

    def test_transfer_ticket_to_self(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = self.ticket_class_normal1
        ticket.owner = self.user1
        ticket.save()

        resp = self.client.post(
            reverse("tickets-transfer", args=(ticket.id,)),
            {"username": self.user1.username},
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_update_attendance(self):
        self.client.login(username=self.user1.username, password="test")
        Membership.objects.create(
            person=self.user1,
            club=self.club1,
            title="Officer",
            role=Membership.ROLE_OFFICER,
        )
        ticket = self.ticket_class_normal1
        ticket.owner = self.user2
        ticket.save()

        resp = self.client.patch(
            reverse("tickets-detail", args=(ticket.id,)),
            {"attended": True},
            format="json",
        )
        ticket.refresh_from_db()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(ticket.attended)

    def test_update_attendance_non_officer(self):
        # user1 is no longer an officer for the ticket's club
        self.client.login(username=self.user1.username, password="test")
        ticket = self.ticket_class_normal1
        ticket.owner = self.user1
        ticket.save()

        resp = self.client.patch(
            reverse("tickets-detail", args=(ticket.id,)),
            {"attended": True},
            format="json",
        )
        ticket.refresh_from_db()
        self.assertEqual(resp.status_code, 404, resp.content)
        self.assertFalse(ticket.attended)


class TicketModelTestCase(TestCase):
    """
    Test cases related to the models that correspond to the ticketing project:
    Ticket, TicketTransactionRecord, TicketTransferRecord, TicketManager
    """

    def setUp(self):
        commonSetUp(self)

    def test_delete_tickets_without_transaction_record(self):
        # check that delete on queryset still works
        tickets = Ticket.objects.filter(type="normal")
        tickets.delete()
        self.assertFalse(Ticket.objects.filter(type="normal").exists())

    def test_delete_ticket_after_purchase(self):
        ticket = self.ticket_class_normal1
        ticket.owner = self.user1
        transaction_record = TicketTransactionRecord.objects.create(
            buyer_first_name=self.user1.first_name,
            buyer_last_name=self.user2.last_name,
            total_amount=ticket.price,
        )
        ticket.transaction_record = transaction_record
        ticket.save()

        with self.assertRaises(ProtectedError):
            ticket.delete()

    def test_bulk_delete_tickets_after_purchase(self):
        transaction_record = TicketTransactionRecord.objects.create(
            buyer_first_name=self.user1.first_name,
            buyer_last_name=self.user2.last_name,
            total_amount=0,
        )
        tickets = Ticket.objects.filter(type="normal")
        tickets.update(owner=self.user1, transaction_record=transaction_record)

        with self.assertRaises(ProtectedError):
            tickets.delete()

    def test_delete_ticket_after_transfer(self):
        ticket = self.ticket_class_normal1
        ticket.owner = self.user2
        ticket.save()
        TicketTransferRecord.objects.create(
            ticket=ticket, sender=self.user1, receiver=self.user2
        )

        with self.assertRaises(ProtectedError):
            ticket.delete()
