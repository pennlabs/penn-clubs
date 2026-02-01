from dataclasses import dataclass
from datetime import timedelta
from uuid import uuid4

import freezegun
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.db.models import Count
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
    TicketTransactionRecord,
    TicketTransferRecord,
)
from clubs.views import generate_cybersource_signature


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

    self.ticket_totals = [
        {"type": "normal", "count": 20, "price": 15.0},
        {"type": "premium", "count": 10, "price": 30.0},
    ]

    self.tickets1 = [
        Ticket.objects.create(type="normal", showing=self.event_showing1, price=15.0)
        for _ in range(20)
    ]
    self.tickets2 = [
        Ticket.objects.create(type="premium", showing=self.event_showing1, price=30.0)
        for _ in range(10)
    ]

    self.unapproved_tickets = [
        Ticket.objects.create(
            type="normal", showing=self.unapproved_event_showing, price=15.0
        )
        for _ in range(20)
    ]


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

        qts = {
            "quantities": [
                {"type": "_normal", "count": 20, "price": 10},
                {"type": "_premium", "count": 10, "price": 20},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            qts,
            format="json",
        )

        aggregated_tickets = list(
            Ticket.objects.filter(showing=self.event_showing1, type__contains="_")
            .values("type", "price")
            .annotate(count=Count("id"))
        )
        for t1, t2 in zip(qts["quantities"], aggregated_tickets):
            self.assertEqual(t1["type"], t2["type"])
            self.assertAlmostEqual(t1["price"], float(t2["price"]), 0.02)
            self.assertEqual(t1["count"], t2["count"])

        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_create_ticket_offerings_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")

        tickets = [
            Ticket(type="free", showing=self.event_showing1, price=0.0)
            for _ in range(10)
        ]
        Ticket.objects.bulk_create(tickets)

        qts = {
            "quantities": [
                {"type": "_free", "count": 10, "price": 0},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            qts,
            format="json",
        )

        aggregated_tickets = list(
            Ticket.objects.filter(showing=self.event_showing1, type__contains="_")
            .values("type", "price")
            .annotate(count=Count("id"))
        )
        for t1, t2 in zip(qts["quantities"], aggregated_tickets):
            self.assertEqual(t1["type"], t2["type"])
            self.assertAlmostEqual(t1["price"], float(t2["price"]), 0.00)
            self.assertEqual(t1["count"], t2["count"])

        self.assertIn(resp.status_code, [200, 201], resp.content)

    def test_create_ticket_offerings_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        qts = {
            "quantities": [
                {"type": "_normal", "count": 20, "price": 10},
                {"type": "_premium", "count": 10, "price": 20},
            ]
        }

        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            qts,
            format="json",
        )

        self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_ticket_offerings_bad_data(self):
        self.client.login(username=self.user1.username, password="test")
        bad_data = [
            {
                # Bad toplevel field
                "quant1t13s": [
                    {"type": "_normal", "count": 20, "price": 10},
                    {"type": "_premium", "count": 10, "price": 20},
                ]
            },
            {
                "quantities": [
                    # Negative price
                    {"type": "_normal", "count": 20, "price": -10},
                    {"type": "_premium", "count": 10, "price": -20},
                ]
            },
            {
                "quantities": [
                    # Bad field members
                    {"abcd": "_normal", "abcde": 20, "price": -10},
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
            self.assertIn(resp.status_code, [400], resp.content)
            self.assertEqual(Ticket.objects.filter(type__contains="_").count(), 0, data)

    def test_create_ticket_offerings_delay_drop(self):
        self.client.login(username=self.user1.username, password="test")

        args = {
            "quantities": [
                {"type": "_normal", "count": 20, "price": 10},
                {"type": "_premium", "count": 10, "price": 20},
            ],
            "drop_time": (timezone.now() + timezone.timedelta(hours=12)).strftime(
                "%Y-%m-%dT%H:%M:%S%z"
            ),
        }
        _ = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )

        self.event_showing1.refresh_from_db()

        # Drop time should be set
        self.assertIsNotNone(self.event_showing1.ticket_drop_time)

        # Drop time should be 12 hours from initial ticket creation
        expected_drop_time = timezone.now() + timezone.timedelta(hours=12)
        diff = abs(self.event_showing1.ticket_drop_time - expected_drop_time)
        self.assertTrue(diff < timezone.timedelta(minutes=5))

        # Move Django's internal clock 13 hours forward
        with freezegun.freeze_time(timezone.now() + timezone.timedelta(hours=13)):
            resp = self.client.put(
                reverse(
                    "club-events-showings-tickets",
                    args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
                ),
                args,
                format="json",
            )

            # Tickets shouldn't be editable after drop time has elapsed
            self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_ticket_offerings_already_owned_or_held(self):
        self.client.login(username=self.user1.username, password="test")

        # Create ticket offerings
        args = {
            "quantities": [
                {"type": "_normal", "count": 5, "price": 10},
                {"type": "_premium", "count": 3, "price": 20},
            ],
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

        # Simulate checkout by applying holds
        for ticket in Ticket.objects.filter(type="_normal"):
            ticket.holder = self.user1
            ticket.save()

        # Recreating tickets should fail
        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Simulate purchase by transferring ownership
        for ticket in Ticket.objects.filter(type="_normal", holder=self.user1):
            ticket.owner = self.user1
            ticket.holder = None
            ticket.save()

        # Recreating tickets should fail
        resp = self.client.put(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            args,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        # Changing ticket drop time should fail
        resp = self.client.patch(
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
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_issue_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                {"username": self.user1.username, "ticket_type": "normal"},
                {"username": self.user1.username, "ticket_type": "premium"},
                {"username": self.user2.username, "ticket_type": "normal"},
                {"username": self.user2.username, "ticket_type": "premium"},
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

        self.assertEqual(resp.status_code, 200, resp.content)

        for item in args["tickets"]:
            username, ticket_type = item["username"], item["ticket_type"]
            user = get_user_model().objects.get(username=username)

            self.assertEqual(
                Ticket.objects.filter(
                    type=ticket_type, owner=user, transaction_record__total_amount=0.0
                )
                .select_related("transaction_record")
                .count(),
                1,
            )

    def test_issue_tickets_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        args = {
            "tickets": [
                {"username": self.user1.username, "ticket_type": "normal"},
                {"username": self.user2.username, "ticket_type": "normal"},
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
        # All usernames must be valid
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                {"username": "invalid_user_1", "ticket_type": "normal"},
                {"username": "invalid_user_2", "ticket_type": "premium"},
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
        self.assertEqual(data["errors"], ["invalid_user_1", "invalid_user_2"])

        # All requested ticket types must be valid
        args = {
            "tickets": [
                {"username": self.user2.username, "ticket_type": "invalid_type_1"},
                {"username": self.user2.username, "ticket_type": "invalid_type_2"},
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
        self.assertEqual(data["errors"], ["invalid_type_1", "invalid_type_2"])

    def test_issue_tickets_insufficient_quantity(self):
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                {"username": self.user2.username, "ticket_type": "normal"}
                for _ in range(100)
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
        self.assertIn(
            "Not enough tickets available for type: normal", str(resp.content)
        )

        # No tickets should be transferred
        self.assertEqual(Ticket.objects.filter(owner=self.user2).count(), 0)

        # No holds should be given
        self.assertEqual(
            Ticket.objects.filter(type="normal", holder__isnull=False).count(), 0
        )

    def test_email_blast(self):
        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user1.username, password="test")

        ticket1 = self.tickets1[0]
        ticket1.owner = self.user2
        ticket1.save()

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
        # Delete all the tickets
        Ticket.objects.all().delete()

        resp = self.client.get(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        self.assertEqual(data["totals"], [], data["totals"])
        self.assertEqual(data["available"], [], data["available"])

    def test_get_tickets_information(self):
        # Buy all normal tickets
        for ticket in self.tickets1:
            ticket.owner = self.user1
            ticket.save()

        resp = self.client.get(
            reverse(
                "club-events-showings-tickets",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        self.assertEqual(data["totals"], self.ticket_totals, data["totals"])
        self.assertEqual(
            data["available"],
            # Only premium tickets available
            [t for t in self.ticket_totals if t["type"] == "premium"],
            data["available"],
        )

    def test_get_tickets_buyers(self):
        self.client.login(username=self.user1.username, password="test")

        # Buy all normal tickets
        for ticket in self.tickets1:
            ticket.owner = self.user1
            ticket.save()

        resp = self.client.get(
            reverse(
                "club-events-showings-buyers",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )

        data = resp.json()
        # Assert ownership correctly determined
        for owned_ticket in data["buyers"]:
            self.assertEqual(owned_ticket["owner_id"], self.user1.id)

    def test_get_tickets_buyers_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        for ticket in self.tickets1:
            ticket.owner = self.user1
            ticket.save()

        resp = self.client.get(
            reverse(
                "club-events-showings-buyers",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
        )

        self.assertEqual(resp.status_code, 403, resp)

    def test_add_to_cart(self):
        self.client.login(username=self.user1.username, password="test")

        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 3, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 2, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="premium").count(), 1, cart.tickets)

    def test_add_to_cart_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")

        # Set the event end time to the past
        self.event_showing1.end_time = timezone.now() - timezone.timedelta(days=1)
        self.event_showing1.save()

        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 1},
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

        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertIn("This showing has already ended", resp.data["detail"], resp.data)

    def test_add_to_cart_twice_accumulates(self):
        self.client.login(username=self.user1.username, password="test")

        # Adding 3 tickets twice
        for _ in range(2):
            tickets_to_add = {
                "quantities": [
                    {"type": "normal", "count": 2},
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

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 6, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 4, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="premium").count(), 2, cart.tickets)

    def test_add_to_cart_order_limit_exceeded(self):
        self.client.login(username=self.user1.username, password="test")

        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 200},
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
        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertIn(
            "Order exceeds the maximum ticket limit of", resp.data["detail"], resp.data
        )

    def test_add_to_cart_tickets_unavailable(self):
        self.client.login(username=self.user1.username, password="test")

        # Delete all but 1 ticket
        for t in list(Ticket.objects.all())[:-1]:
            t.delete()

        # Try to add two tickets
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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
        self.assertEqual(resp.status_code, 403, resp.data)
        self.assertIn(
            "Not enough tickets of type normal left!", resp.data["detail"], resp.data
        )

    def test_add_to_cart_before_ticket_drop(self):
        self.client.login(username=self.user1.username, password="test")

        # Set drop time
        self.event_showing1.ticket_drop_time = timezone.now() + timedelta(hours=12)
        self.event_showing1.save()

        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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

        # Tickets should not be added to cart before drop time
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_add_to_cart_unapproved_club(self):
        self.client.login(username=self.user1.username, password="test")
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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
            tickets_to_add,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)
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
            tickets_to_add,
            format="json",
        )
        # Cannot see event
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_add_to_cart_nonexistent_club(self):
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(
                    "Random club name",
                    self.unapproved_event.pk,
                    self.event_showing1.pk,
                ),
            ),
            tickets_to_add,
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_remove_from_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 3, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 2, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="premium").count(), 1, cart.tickets)

        # Remove all but one from normal
        tickets_to_remove = {
            "quantities": [
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }

        resp = self.client.post(
            reverse(
                "club-events-showings-remove-from-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_remove,
            format="json",
        )

        self.assertIn(resp.status_code, [200, 201], resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 1, cart.tickets)

    def test_remove_from_cart_extra(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
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

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 3, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 2, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="premium").count(), 1, cart.tickets)

        # Remove more than what exists...still ok.
        tickets_to_remove = {
            "quantities": [
                {"type": "normal", "count": 200},
                {"type": "premium", "count": 100},
            ]
        }
        resp = self.client.post(
            reverse(
                "club-events-showings-remove-from-cart",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            ),
            tickets_to_remove,
            format="json",
        )

        self.assertIn(resp.status_code, [200, 201], resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 0, cart.tickets)

    def test_delete_event_with_claimed_tickets(self):
        # Simulate checkout (hold ticket)
        self.tickets1[0].holder = self.user1
        self.tickets1[0].save()

        self.client.login(username=self.user1.username, password="test")
        resp_held = self.client.delete(
            reverse(
                "club-events-showings-detail",
                args=(self.club1.code, self.event1.pk, self.event_showing1.pk),
            )
        )
        self.assertEqual(resp_held.status_code, 400, resp_held.content)

        # Simulate purchase (transfer ticket)
        self.tickets1[0].holder = None
        self.tickets1[0].owner = self.user1
        self.tickets1[0].save()

        resp_bought = self.client.delete(
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk))
        )
        self.assertEqual(resp_bought.status_code, 400, resp_bought.content)


@dataclass
class MockCybersourceResponse:
    """Mock response data from CyberSource Secure Acceptance"""

    transaction_uuid: str = None
    decision: str = "ACCEPT"
    reason_code: str = "100"
    transaction_id: str = "test_transaction_123"
    request_id: str = "test_request_123"
    amount: str = "20.00"
    first_name: str = "Rohan"
    last_name: str = "Gupta"
    email: str = "r@g.com"

    def __post_init__(self):
        if self.transaction_uuid is None:
            self.transaction_uuid = str(uuid4())

    def to_post_params(self) -> dict:
        """Generate POST params as CyberSource would send them"""
        params = {
            "decision": self.decision,
            "reason_code": self.reason_code,
            "transaction_id": self.transaction_id,
            "request_id": self.request_id,
            "req_transaction_uuid": self.transaction_uuid,
            "req_reference_number": self.transaction_uuid,
            "req_amount": self.amount,
            "req_bill_to_forename": self.first_name,
            "req_bill_to_surname": self.last_name,
            "req_bill_to_email": self.email,
            "signed_field_names": ",".join(
                [
                    "decision",
                    "reason_code",
                    "transaction_id",
                    "request_id",
                    "req_transaction_uuid",
                    "req_reference_number",
                    "req_amount",
                    "req_bill_to_forename",
                    "req_bill_to_surname",
                    "req_bill_to_email",
                ]
            ),
        }
        # Sign the params
        params["signature"] = generate_cybersource_signature(
            params, settings.CYBERSOURCE_SA_SECRET_KEY
        )
        return params


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
        ticket = self.tickets1[0]

        # Fail to get when not owned
        resp = self.client.get(
            reverse("tickets-detail", args=(ticket.id,)), format="json"
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        # Succeed when owned
        ticket.owner = self.user1
        ticket.save()
        resp = self.client.get(
            reverse("tickets-detail", args=(ticket.id,)), format="json"
        )
        data = resp.json()
        self.assertEqual(resp.status_code, 200, resp.content)

        # Test the serializer API
        for field in ["price", "id", "type", "owner", "event"]:
            self.assertIn(field, data, data)

    def test_list_tickets_owned_by_me(self):
        self.client.login(username=self.user1.username, password="test")

        # Fail to get when not owned
        resp = self.client.get(reverse("tickets-list"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json(), [], resp)

        # List all 5 tickets when owned
        for ticket in self.tickets1[:5]:
            ticket.owner = self.user1
            ticket.save()

        resp = self.client.get(reverse("tickets-list"), format="json")
        data = resp.json()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(data), 5, data)

    def test_get_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:5]
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
        tickets_to_add = self.tickets1[:5]
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

    def test_get_cart_replacement_required(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # Sell the first two
        for selling_ticket in tickets_to_add[:2]:
            selling_ticket.owner = self.user2
            selling_ticket.save()

        resp = self.client.get(reverse("tickets-cart"), format="json")
        data = resp.json()

        # The cart still has 5 tickets: just replaced with available ones
        self.assertEqual(len(data["tickets"]), 5, data)
        self.assertEqual(len(data["sold_out"]), 0, data)

        in_cart = set(map(lambda t: t["id"], data["tickets"]))
        to_add = set(map(lambda t: str(t.id), tickets_to_add))

        # 3 tickets are the same
        self.assertEqual(len(in_cart & to_add), 3, in_cart | to_add)

    def test_get_cart_replacement_required_sold_out(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # There are 5 tickets in the cart. We will sell
        # all but 3 tickets of this type to someone
        # This should force 2 tickets reporting as sold out
        for selling_ticket in self.tickets1[:-3]:
            selling_ticket.owner = self.user2
            selling_ticket.save()

        resp = self.client.get(reverse("tickets-cart"), format="json")
        data = resp.json()

        # The cart now has 3 tickets
        self.assertEqual(len(data["tickets"]), 3, data)

        # Only 1 type of ticket should be sold out
        self.assertEqual(len(data["sold_out"]), 1, data)

        # 2 normal tickets should be sold out
        expected_sold_out = {
            "type": self.tickets1[0].type,
            "showing": {
                "id": self.tickets1[0].showing.id,
            },
            "event": {
                "id": self.tickets1[0].showing.event.id,
                "name": self.tickets1[0].showing.event.name,
            },
            "count": 2,
        }
        for key, val in expected_sold_out.items():
            self.assertEqual(data["sold_out"][0][key], val, data)

        # 0 tickets are the same (we sell all but last 3)
        in_cart = set(map(lambda t: t["id"], data["tickets"]))
        to_add = set(map(lambda t: str(t.id), tickets_to_add))
        self.assertEqual(len(in_cart & to_add), 0, in_cart | to_add)

    def test_get_cart_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:5]
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
            "type": self.tickets1[0].type,
            "showing": {
                "id": self.tickets1[0].showing.id,
            },
            "event": {
                "id": self.event1.id,
                "name": self.event1.name,
            },
            "count": 5,
        }
        for key, val in expected_sold_out.items():
            self.assertEqual(data["sold_out"][0][key], val, data)

    def test_place_hold_on_tickets(self):
        from clubs.views import TicketViewSet

        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:3]
        cart.tickets.add(*tickets_to_add)
        cart.save()

        TicketViewSet._place_hold_on_tickets(self.user1, cart.tickets)
        holding_expiration = timezone.now() + timezone.timedelta(minutes=10)

        for ticket in cart.tickets.all():
            self.assertIsNone(ticket.owner)
            self.assertEqual(self.user1, ticket.holder)
            self.assertAlmostEqual(
                holding_expiration,
                ticket.holding_expiration,
                delta=timedelta(seconds=10),
            )

        # Move Django's internal clock 10 minutes forward
        with freezegun.freeze_time(holding_expiration):
            Ticket.objects.update_holds()
            for ticket in cart.tickets.all():
                self.assertIsNone(ticket.owner)
                self.assertIsNone(ticket.holder)

    def test_give_tickets(self):
        from clubs.views import TicketViewSet

        self.client.login(username=self.user1.username, password="test")
        # Add a few tickets
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:3]
        cart.tickets.add(*tickets_to_add)
        cart.save()

        transaction_uuid = uuid4()
        order_info = {
            "total_amount": TicketViewSet._calculate_cart_total(cart),
            "first_name": self.user1.first_name,
            "last_name": self.user1.last_name,
            "email": self.user1.email,
            "phone": "3021239234",
            "transaction_id": "test_txn_123",
            "request_id": "test_req_123",
            "reference_number": str(transaction_uuid),
            "transaction_uuid": transaction_uuid,
            "decision": "ACCEPT",
            "reason_code": "100",
        }

        TicketViewSet._place_hold_on_tickets(self.user1, cart.tickets)
        TicketViewSet._give_tickets(
            self.user1,
            order_info,
            cart,
            transaction_uuid,
        )

        # Check that tickets are assigned their owner
        for ticket in cart.tickets.all():
            self.assertEqual(self.user1, ticket.owner)
            self.assertIsNone(ticket.holder)

        # Check that the cart is empty
        self.assertEqual(0, cart.tickets.count())

        # Check that transaction record is created
        record_exists = TicketTransactionRecord.objects.filter(
            transaction_uuid=transaction_uuid
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
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()

        # No free tickets should be sold
        self.assertFalse(data["sold_free_tickets"])

        # Verify response contains CyberSource payment params
        self.assertTrue(data["success"])
        self.assertIn("cybersource_url", data)
        self.assertIn("payment_params", data)
        self.assertIn("signature", data["payment_params"])
        self.assertIn("transaction_uuid", data["payment_params"])

        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Transaction UUID should be tied to cart
        cart = Cart.objects.filter(owner=self.user1).first()
        self.assertIsNotNone(cart.pending_transaction_uuid)
        self.assertEqual(str(cart.pending_transaction_uuid), transaction_uuid)

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
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()

        # Free ticket should be sold with non-free tickets if purchased together
        self.assertFalse(data["sold_free_tickets"])

        # Verify response contains CyberSource payment params
        self.assertTrue(data["success"])
        self.assertIn("cybersource_url", data)
        self.assertIn("payment_params", data)
        self.assertIn("signature", data["payment_params"])
        self.assertIn("transaction_uuid", data["payment_params"])

        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Transaction UUID should be tied to cart
        cart = Cart.objects.filter(owner=self.user1).first()
        self.assertIsNotNone(cart.pending_transaction_uuid)
        self.assertEqual(str(cart.pending_transaction_uuid), transaction_uuid)

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

        # Initiate checkout - free tickets are sold immediately
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()

        # check that free tickets were sold
        self.assertTrue(data["sold_free_tickets"])

        # Ownership transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 3, owned_tickets)

        # Cart empty
        user_cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(user_cart.tickets.count(), 0, user_cart)

        # Tickets held is 0
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 0, held_tickets)

        # Check that transaction record is created with null transaction_uuid
        # (free tickets don't go through CyberSource)
        record_exists = TicketTransactionRecord.objects.filter(
            transaction_uuid__isnull=True
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

        # Initiate checkout - should fail because ticket drop time hasn't passed
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
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        transaction_uuid_1 = data["payment_params"]["transaction_uuid"]

        cart = Cart.objects.filter(owner=self.user1).first()
        stored_uuid_1 = str(cart.pending_transaction_uuid)
        self.assertEqual(stored_uuid_1, transaction_uuid_1)

        # Initiate second checkout
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        transaction_uuid_2 = data["payment_params"]["transaction_uuid"]

        cart.refresh_from_db()
        stored_uuid_2 = str(cart.pending_transaction_uuid)
        self.assertEqual(stored_uuid_2, transaction_uuid_2)

        # Stored transaction UUID should change between checkouts
        self.assertNotEqual(stored_uuid_1, stored_uuid_2)

    def test_initiate_checkout_fails_with_empty_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Assert non existent cart
        cart, created = Cart.objects.get_or_create(owner=self.user1)
        self.assertTrue(created)

        # Initiate checkout, fail with 400 (cart is empty)
        # NOTE: If the cart does not exist, we will have a 404
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertEqual(resp.status_code, 400, resp.content)

        # Tickets are not held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertFalse(held_tickets.exists())

    def test_initiate_checkout_stale_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:5]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # In the meantime, someone snipes a ticket we added by holding
        sniped_ticket = self.tickets1[0]
        sniped_ticket.holder = self.user2
        sniped_ticket.save()

        # Initiate checkout for the first time
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
        """Test the complete checkout flow with Secure Acceptance"""
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
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()

        # Verify response contains CyberSource payment params
        self.assertTrue(data["success"])
        self.assertFalse(data["sold_free_tickets"])
        self.assertIn("cybersource_url", data)
        self.assertIn("payment_params", data)
        self.assertIn("signature", data["payment_params"])
        self.assertIn("transaction_uuid", data["payment_params"])

        # Get the transaction UUID for later
        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Verify tickets are held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 2, held_tickets)

        # Verify cart has pending transaction UUID
        user_cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(str(user_cart.pending_transaction_uuid), transaction_uuid)

        # Simulate CyberSource callback with payment_complete
        mock_response = MockCybersourceResponse(transaction_uuid=transaction_uuid)
        resp = self.client.post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )

        # Should redirect to success
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("success=true", resp.url)

        # Ownership transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 2, owned_tickets)

        # Cart empty
        user_cart.refresh_from_db()
        self.assertEqual(user_cart.tickets.count(), 0, user_cart)
        self.assertIsNone(user_cart.pending_transaction_uuid)

        # Tickets held is 0
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 0, held_tickets)

        # Check that transaction record is created
        record = TicketTransactionRecord.objects.filter(
            transaction_uuid=transaction_uuid
        ).first()
        self.assertIsNotNone(record)
        self.assertEqual(record.decision, "ACCEPT")

    def test_payment_complete_stale_cart(self):
        """Test payment completion when hold has expired"""
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        # Initiate checkout
        resp = self.client.post(reverse("tickets-initiate-checkout"))
        self.assertIn(resp.status_code, [200, 201], resp.content)
        data = resp.json()
        transaction_uuid = data["payment_params"]["transaction_uuid"]

        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 2, held_tickets)

        # Make holds expire prematurely, creating a stale cart
        for ticket in held_tickets:
            ticket.holding_expiration = timezone.now() - timedelta(minutes=1)
            ticket.save()

        # Trigger hold expiration
        Ticket.objects.update_holds()

        # Now simulate CyberSource callback - payment was successful but hold expired
        mock_response = MockCybersourceResponse(transaction_uuid=transaction_uuid)
        resp = self.client.post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )

        # Should redirect with error about hold expiring
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("expired", resp.url.lower())

        # Ownership not transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 0, owned_tickets)

    def test_payment_complete_invalid_signature(self):
        """Test payment completion with invalid signature"""
        self.client.login(username=self.user1.username, password="test")

        # Add tickets and initiate checkout
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        resp = self.client.post(reverse("tickets-initiate-checkout"))
        data = resp.json()
        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Create response with invalid signature
        mock_response = MockCybersourceResponse(transaction_uuid=transaction_uuid)
        params = mock_response.to_post_params()
        params["signature"] = "invalid_signature"

        resp = self.client.post(
            reverse("tickets-payment-complete"),
            params,
        )

        # Should redirect with error
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("signature", resp.url.lower())

        # Ownership not transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 0, owned_tickets)

    def test_payment_complete_declined(self):
        """Test payment completion when payment is declined"""
        self.client.login(username=self.user1.username, password="test")

        # Add tickets and initiate checkout
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:2]
        for ticket in tickets_to_add:
            cart.tickets.add(ticket)
        cart.save()

        resp = self.client.post(reverse("tickets-initiate-checkout"))
        data = resp.json()
        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Create response with DECLINE decision
        mock_response = MockCybersourceResponse(
            transaction_uuid=transaction_uuid,
            decision="DECLINE",
            reason_code="200",
        )
        resp = self.client.post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )

        # Should redirect with error
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("declined", resp.url.lower())

        # Ownership not transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 0, owned_tickets)

        # Hold released
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 0, held_tickets)

        # Cart transaction UUID cleared
        cart.refresh_from_db()
        self.assertIsNone(cart.pending_transaction_uuid)

    def test_transfer_ticket(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = self.tickets1[0]

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
        ticket = self.tickets1[0]
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
        ticket = self.tickets1[0]
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
        ticket = self.tickets1[0]
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
        ticket = self.tickets1[0]
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

    def test_update_holds(self):
        expired_time = timezone.now() - timedelta(hours=1)
        valid_time = timezone.now() + timedelta(hours=1)

        # Apply exired holds
        for ticket in self.tickets1[:5]:
            ticket.holder = self.user1
            ticket.holding_expiration = expired_time
            ticket.save()

        # Apply valid holds
        for ticket in self.tickets2[:5]:
            ticket.holder = self.user1
            ticket.holding_expiration = valid_time
            ticket.save()

        Ticket.objects.update_holds()

        # Expired holds should be cleared
        self.assertEqual(
            Ticket.objects.filter(
                holder__isnull=False, holding_expiration__lte=timezone.now()
            ).count(),
            0,
        )

        # Valid holds should be in place
        self.assertEqual(
            Ticket.objects.filter(
                holder__isnull=False, holding_expiration__gt=timezone.now()
            ).count(),
            5,
        )

    def test_delete_tickets_without_transaction_record(self):
        # check that delete on queryset still works
        tickets = Ticket.objects.filter(type="normal")
        tickets.delete()
        self.assertFalse(Ticket.objects.filter(type="normal").exists())

    def test_delete_ticket_after_purchase(self):
        ticket = self.tickets1[0]
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
        ticket = self.tickets1[0]
        ticket.owner = self.user2
        ticket.save()
        TicketTransferRecord.objects.create(
            ticket=ticket, sender=self.user1, receiver=self.user2
        )

        with self.assertRaises(ProtectedError):
            ticket.delete()
