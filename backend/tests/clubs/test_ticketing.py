from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal
from uuid import uuid4

import freezegun
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import (
    Cart,
    CartItem,
    Club,
    Event,
    EventShowing,
    Membership,
    Ticket,
    TicketClass,
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

    self.normal_class = TicketClass.objects.create(
        showing=self.event_showing1,
        name="normal",
        price=Decimal("15.00"),
        quantity=20,
        remaining=20,
    )
    self.premium_class = TicketClass.objects.create(
        showing=self.event_showing1,
        name="premium",
        price=Decimal("30.00"),
        quantity=10,
        remaining=10,
    )
    self.unapproved_class = TicketClass.objects.create(
        showing=self.unapproved_event_showing,
        name="normal",
        price=Decimal("15.00"),
        quantity=20,
        remaining=20,
    )


def sell_tickets(ticket_class, owner=None, quantity=1, owner_email=None):
    """
    Test helper that issues ``quantity`` tickets of ``ticket_class`` to ``owner``
    (or a guest email), decrementing inventory the same way checkout does.
    """
    email = owner_email or (owner.email if owner else "")
    tickets = Ticket.objects.bulk_create(
        [
            Ticket(ticket_class=ticket_class, owner=owner, owner_email=email)
            for _ in range(quantity)
        ]
    )
    ticket_class.remaining -= quantity
    ticket_class.save(update_fields=["remaining"])
    return tickets


class TicketingTestMixin:
    def showing_url(self, name, showing=None):
        showing = showing or self.event_showing1
        return reverse(
            f"club-events-showings-{name}",
            args=(showing.event.club.code, showing.event.pk, showing.pk),
        )

    def add_to_cart(self, quantities, showing=None):
        return self.client.post(
            self.showing_url("add-to-cart", showing),
            {
                "quantities": [
                    {"ticket_class_id": ticket_class.id, "quantity": quantity}
                    for ticket_class, quantity in quantities
                ]
            },
            format="json",
        )

    def remove_from_cart(self, quantities, showing=None):
        return self.client.post(
            self.showing_url("remove-from-cart", showing),
            {
                "quantities": [
                    {"ticket_class_id": ticket_class.id, "quantity": quantity}
                    for ticket_class, quantity in quantities
                ]
            },
            format="json",
        )

    def cart_quantity(self, cart, ticket_class):
        item = cart.items.filter(ticket_class=ticket_class).first()
        return item.quantity if item else 0


class TicketEventTestCase(TicketingTestMixin, TestCase):
    """
    Test cases related to the methods on the ClubEventShowingViewSet
    that correspond to the ticketing project:

    tickets (get), tickets (put), issue_tickets, buyers, email_blast,
    cart, add_to_cart, remove_from_cart
    """

    def setUp(self):
        commonSetUp(self)

    def test_create_ticket_offerings(self):
        self.client.login(username=self.user1.username, password="test")

        # Test invalid ticket_drop_time editing
        resp = self.client.patch(
            self.showing_url("detail"),
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
            self.showing_url("detail"),
            {
                "start_time": (
                    self.event_showing1.end_time + timezone.timedelta(days=20)
                ).strftime("%Y-%m-%dT%H:%M:%S%z")
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.content)

        args = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {
                    "name": "_premium",
                    "quantity": 10,
                    "price": 20,
                    "description": "Front row",
                    "transferable": False,
                    "group_size": 2,
                    "group_discount": 0.25,
                },
            ]
        }

        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Existing ticket classes should be replaced
        ticket_classes = list(
            TicketClass.objects.filter(showing=self.event_showing1).order_by("name")
        )
        self.assertEqual([tc.name for tc in ticket_classes], ["_normal", "_premium"])
        for expected, actual in zip(args["ticket_types"], ticket_classes):
            self.assertEqual(actual.quantity, expected["quantity"])
            self.assertEqual(actual.remaining, expected["quantity"])
            self.assertEqual(actual.price, Decimal(expected["price"]))

        premium = ticket_classes[1]
        self.assertEqual(premium.description, "Front row")
        self.assertFalse(premium.transferable)
        self.assertEqual(premium.group_size, 2)
        self.assertEqual(premium.group_discount, Decimal("0.25"))

    def test_create_ticket_offerings_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")

        args = {"ticket_types": [{"name": "_free", "quantity": 10, "price": 0}]}
        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertIn(resp.status_code, [200, 201], resp.content)

        free = TicketClass.objects.get(showing=self.event_showing1, name="_free")
        self.assertEqual(free.price, Decimal("0"))
        self.assertEqual(free.quantity, 10)

    def test_create_ticket_offerings_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        args = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {"name": "_premium", "quantity": 10, "price": 20},
            ]
        }

        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_ticket_offerings_bad_data(self):
        self.client.login(username=self.user1.username, password="test")
        bad_data = [
            {
                # Bad toplevel field
                "t1ck3t_types": [
                    {"name": "_normal", "quantity": 20, "price": 10},
                ]
            },
            {
                "ticket_types": [
                    # Negative price
                    {"name": "_normal", "quantity": 20, "price": -10},
                ]
            },
            {
                "ticket_types": [
                    # Bad field members
                    {"abcd": "_normal", "abcde": 20, "price": 10},
                ]
            },
            {
                "ticket_types": [
                    # Zero quantity
                    {"name": "_normal", "quantity": 0, "price": 10},
                ]
            },
            {
                "ticket_types": [
                    # Duplicate names
                    {"name": "_normal", "quantity": 1, "price": 10},
                    {"name": "_normal", "quantity": 1, "price": 10},
                ]
            },
            {
                "ticket_types": [
                    # Group discount without group size
                    {
                        "name": "_normal",
                        "quantity": 1,
                        "price": 10,
                        "group_discount": 0.5,
                    },
                ]
            },
            {
                "ticket_types": [
                    # Group discount out of range
                    {
                        "name": "_normal",
                        "quantity": 1,
                        "price": 10,
                        "group_size": 2,
                        "group_discount": 1.5,
                    },
                ]
            },
        ]

        for data in bad_data:
            resp = self.client.put(self.showing_url("tickets"), data, format="json")
            self.assertEqual(resp.status_code, 400, resp.content)
            # Existing offerings must be untouched
            self.assertFalse(TicketClass.objects.filter(name__contains="_").exists())
            self.assertEqual(
                TicketClass.objects.filter(showing=self.event_showing1).count(), 2, data
            )

    def test_create_ticket_offerings_delay_drop(self):
        self.client.login(username=self.user1.username, password="test")

        args = {
            "ticket_types": [
                {"name": "_normal", "quantity": 20, "price": 10},
                {"name": "_premium", "quantity": 10, "price": 20},
            ],
            "drop_time": (timezone.now() + timezone.timedelta(hours=12)).strftime(
                "%Y-%m-%dT%H:%M:%S%z"
            ),
        }
        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertIn(resp.status_code, [200, 201], resp.content)

        self.event_showing1.refresh_from_db()

        # Drop time should be set
        self.assertIsNotNone(self.event_showing1.ticket_drop_time)

        # Drop time should be 12 hours from initial ticket creation
        expected_drop_time = timezone.now() + timezone.timedelta(hours=12)
        diff = abs(self.event_showing1.ticket_drop_time - expected_drop_time)
        self.assertTrue(diff < timezone.timedelta(minutes=5))

        # Move Django's internal clock 13 hours forward
        with freezegun.freeze_time(timezone.now() + timezone.timedelta(hours=13)):
            resp = self.client.put(self.showing_url("tickets"), args, format="json")

            # Tickets shouldn't be editable after drop time has elapsed
            self.assertEqual(resp.status_code, 403, resp.content)

    def test_create_ticket_offerings_already_sold(self):
        self.client.login(username=self.user1.username, password="test")

        args = {
            "ticket_types": [
                {"name": "_normal", "quantity": 5, "price": 10},
                {"name": "_premium", "quantity": 3, "price": 20},
            ],
        }
        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertIn(resp.status_code, [200, 201], resp.content)

        # Simulate a purchase
        sell_tickets(TicketClass.objects.get(name="_normal"), owner=self.user2)

        # Recreating tickets should fail
        resp = self.client.put(self.showing_url("tickets"), args, format="json")
        self.assertEqual(resp.status_code, 403, resp.content)

        # Changing ticket drop time should fail
        resp = self.client.patch(
            self.showing_url("detail"),
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
                {
                    "username": self.user2.username,
                    "ticket_type": "premium",
                    "quantity": 2,
                },
            ]
        }
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["detail"], "Issued 5 tickets")

        for item in args["tickets"]:
            user = get_user_model().objects.get(username=item["username"])
            self.assertEqual(
                Ticket.objects.filter(
                    ticket_class__name=item["ticket_type"],
                    owner=user,
                    owner_email=user.email,
                    transaction_record__total_amount=0.0,
                ).count(),
                item.get("quantity", 1),
            )

        # Inventory is decremented
        self.normal_class.refresh_from_db()
        self.premium_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 18)
        self.assertEqual(self.premium_class.remaining, 7)

        # Confirmation emails are sent per ticket
        self.assertEqual(len(mail.outbox), 5)

    def test_issue_tickets_to_guest_email(self):
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                {"email": "guest@example.com", "ticket_type": "normal", "quantity": 2},
            ]
        }
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 200, resp.content)

        guest_tickets = Ticket.objects.filter(owner_email="guest@example.com")
        self.assertEqual(guest_tickets.count(), 2)
        for ticket in guest_tickets:
            self.assertIsNone(ticket.owner)
            self.assertEqual(ticket.ticket_class, self.normal_class)

        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].to, ["guest@example.com"])

    def test_issue_tickets_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        args = {
            "tickets": [
                {"username": self.user1.username, "ticket_type": "normal"},
                {"username": self.user2.username, "ticket_type": "normal"},
            ]
        }

        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
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
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertEqual(resp.json()["errors"], ["invalid_user_1", "invalid_user_2"])

        # All requested ticket types must be valid
        args = {
            "tickets": [
                {"username": self.user2.username, "ticket_type": "invalid_type_1"},
                {"username": self.user2.username, "ticket_type": "invalid_type_2"},
            ]
        }
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertEqual(resp.json()["errors"], ["invalid_type_1", "invalid_type_2"])

        # Guest emails must be valid
        args = {"tickets": [{"email": "not-an-email", "ticket_type": "normal"}]}
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertEqual(resp.json()["errors"], ["not-an-email"])

        # Nothing should have been issued
        self.assertFalse(Ticket.objects.exists())

    def test_issue_tickets_insufficient_quantity(self):
        self.client.login(username=self.user1.username, password="test")
        args = {
            "tickets": [
                {"username": self.user2.username, "ticket_type": "normal"}
                for _ in range(100)
            ]
        }
        resp = self.client.post(self.showing_url("issue-tickets"), args, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn(
            "Not enough tickets available for type: normal", str(resp.content)
        )

        # No tickets should be issued and inventory should be untouched
        self.assertEqual(Ticket.objects.filter(owner=self.user2).count(), 0)
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 20)

    def test_email_blast(self):
        Membership.objects.create(
            person=self.user1, club=self.club1, role=Membership.ROLE_OFFICER
        )
        self.client.login(username=self.user1.username, password="test")

        sell_tickets(self.normal_class, owner=self.user2, quantity=2)
        sell_tickets(self.premium_class, owner_email="guest@example.com")

        resp = self.client.post(
            self.showing_url("email-blast"),
            {"content": "Test email blast content"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]

        # Ticket holders (deduplicated), guests, and officers are all included
        self.assertEqual(email.to.count(self.user2.email), 1)
        self.assertIn("guest@example.com", email.to)
        self.assertIn(self.user1.email, email.to)

        self.assertEqual(
            email.subject, f"Update on {self.event1.name} from {self.club1.name}"
        )
        self.assertIn("Test email blast content", email.body)

    def test_email_blast_empty_content(self):
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.post(
            self.showing_url("email-blast"), {"content": ""}, format="json"
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_get_tickets_information_no_tickets(self):
        TicketClass.objects.all().delete()

        resp = self.client.get(self.showing_url("tickets"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["ticket_types"], [])

    def test_get_tickets_information(self):
        # Buy all normal tickets
        sell_tickets(self.normal_class, owner=self.user1, quantity=20)

        resp = self.client.get(self.showing_url("tickets"))
        self.assertEqual(resp.status_code, 200, resp.content)
        ticket_types = resp.json()["ticket_types"]

        self.assertEqual(len(ticket_types), 2, ticket_types)
        by_name = {tt["name"]: tt for tt in ticket_types}
        self.assertEqual(by_name["normal"]["quantity"], 20)
        self.assertEqual(by_name["normal"]["remaining"], 0)
        self.assertEqual(by_name["normal"]["price"], "15.00")
        self.assertEqual(by_name["premium"]["quantity"], 10)
        self.assertEqual(by_name["premium"]["remaining"], 10)
        self.assertEqual(by_name["premium"]["price"], "30.00")

    def test_get_tickets_buyers(self):
        self.client.login(username=self.user1.username, password="test")

        sell_tickets(self.normal_class, owner=self.user1, quantity=3)
        sell_tickets(self.premium_class, owner_email="guest@example.com")

        resp = self.client.get(self.showing_url("buyers"))
        self.assertEqual(resp.status_code, 200, resp.content)
        buyers = resp.json()["buyers"]
        self.assertEqual(len(buyers), 4, buyers)

        owned = [b for b in buyers if b["owner_id"] is not None]
        guests = [b for b in buyers if b["owner_id"] is None]
        self.assertEqual(len(owned), 3)
        for buyer in owned:
            self.assertEqual(buyer["owner_id"], self.user1.id)
            self.assertEqual(buyer["email"], self.user1.email)
            self.assertEqual(buyer["ticket_type"], "normal")
            self.assertEqual(buyer["fullname"], self.user1.get_full_name())
        self.assertEqual(len(guests), 1)
        self.assertEqual(guests[0]["email"], "guest@example.com")
        self.assertEqual(guests[0]["ticket_type"], "premium")

    def test_get_tickets_buyers_bad_perms(self):
        # user2 is not a superuser or club officer+
        self.client.login(username=self.user2.username, password="test")
        sell_tickets(self.normal_class, owner=self.user1)

        resp = self.client.get(self.showing_url("buyers"))
        self.assertEqual(resp.status_code, 403, resp)

    def test_add_to_cart(self):
        self.client.login(username=self.user1.username, password="test")

        resp = self.add_to_cart([(self.normal_class, 2), (self.premium_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertTrue(data["success"])

        cart = Cart.objects.get(owner=self.user1, showing=self.event_showing1)
        self.assertEqual(data["cart_id"], str(cart.id))
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 2)
        self.assertEqual(self.cart_quantity(cart, self.premium_class), 1)

        # Adding to the cart does not consume inventory
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 20)

        # The cart is retrievable for this showing
        resp = self.client.get(self.showing_url("cart"))
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertEqual(data["id"], str(cart.id))
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["total"], "60.00")

    def test_add_to_cart_guest(self):
        # No login: the cart is tied to the anonymous session
        resp = self.add_to_cart([(self.normal_class, 2)])
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertIn(settings.SESSION_COOKIE_NAME, resp.cookies)

        cart = Cart.objects.get(id=resp.json()["cart_id"])
        self.assertIsNone(cart.owner)
        self.assertEqual(
            cart.session_key, resp.cookies[settings.SESSION_COOKIE_NAME].value
        )
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 2)

        # Subsequent requests from the same session see the same cart
        resp = self.add_to_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["cart_id"], str(cart.id))
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 3)

        resp = self.client.get(self.showing_url("cart"))
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["id"], str(cart.id))

        # A different anonymous session cannot see the cart
        other_client = APIClient()
        resp = other_client.get(self.showing_url("cart"))
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_get_cart_not_found(self):
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(self.showing_url("cart"))
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_add_to_cart_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")

        # Set the event end time to the past
        self.event_showing1.end_time = timezone.now() - timezone.timedelta(days=1)
        self.event_showing1.save()

        resp = self.add_to_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertIn("This showing has already ended", resp.data["detail"], resp.data)

    def test_add_to_cart_twice_accumulates(self):
        self.client.login(username=self.user1.username, password="test")

        for _ in range(2):
            resp = self.add_to_cart([(self.normal_class, 2), (self.premium_class, 1)])
            self.assertEqual(resp.status_code, 200, resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 4)
        self.assertEqual(self.cart_quantity(cart, self.premium_class), 2)

    def test_add_to_cart_order_limit_exceeded(self):
        self.client.login(username=self.user1.username, password="test")

        resp = self.add_to_cart([(self.normal_class, 200), (self.premium_class, 1)])
        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertIn(
            "Order exceeds the maximum ticket limit of", resp.data["detail"], resp.data
        )
        self.assertFalse(CartItem.objects.exists())

    def test_add_to_cart_tickets_unavailable(self):
        self.client.login(username=self.user1.username, password="test")

        # Only 1 normal ticket left
        self.normal_class.remaining = 1
        self.normal_class.save()

        resp = self.add_to_cart([(self.normal_class, 2)])
        self.assertEqual(resp.status_code, 403, resp.data)
        self.assertIn(
            "Not enough tickets of type normal left!", resp.data["detail"], resp.data
        )

        # Adding one is fine, but a second one is not
        resp = self.add_to_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)
        resp = self.add_to_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 403, resp.data)

    def test_add_to_cart_not_buyable(self):
        self.client.login(username=self.user1.username, password="test")
        self.normal_class.buyable = False
        self.normal_class.save()

        resp = self.add_to_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 404, resp.content)

        # Ticket classes from a different showing cannot be added either
        resp = self.add_to_cart([(self.unapproved_class, 1)])
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_add_to_cart_bad_data(self):
        self.client.login(username=self.user1.username, password="test")
        bad_data = [
            {},
            {"quantities": "normal"},
            {"quantities": [{"ticket_class_id": self.normal_class.id}]},
            {"quantities": [{"ticket_class_id": self.normal_class.id, "quantity": 0}]},
            {
                "quantities": [
                    {"ticket_class_id": self.normal_class.id, "quantity": "2"}
                ]
            },
            {"quantities": [{"quantity": 2}]},
        ]
        for data in bad_data:
            resp = self.client.post(
                self.showing_url("add-to-cart"), data, format="json"
            )
            self.assertEqual(resp.status_code, 400, data)
        self.assertFalse(CartItem.objects.exists())

    def test_add_to_cart_before_ticket_drop(self):
        self.client.login(username=self.user1.username, password="test")

        # Set drop time
        self.event_showing1.ticket_drop_time = timezone.now() + timedelta(hours=12)
        self.event_showing1.save()

        resp = self.add_to_cart([(self.normal_class, 2)])

        # Tickets should not be added to cart before drop time
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_add_to_cart_unapproved_club(self):
        self.client.login(username=self.user1.username, password="test")
        resp = self.add_to_cart(
            [(self.unapproved_class, 2)], showing=self.unapproved_event_showing
        )
        self.assertEqual(resp.status_code, 403, resp.content)

        self.client.login(username=self.user2.username, password="test")
        resp = self.add_to_cart(
            [(self.unapproved_class, 2)], showing=self.unapproved_event_showing
        )
        # Cannot see event
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_add_to_cart_nonexistent_club(self):
        resp = self.client.post(
            reverse(
                "club-events-showings-add-to-cart",
                args=(
                    "Random club name",
                    self.unapproved_event.pk,
                    self.event_showing1.pk,
                ),
            ),
            {"quantities": [{"ticket_class_id": self.normal_class.id, "quantity": 2}]},
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_remove_from_cart(self):
        self.client.login(username=self.user1.username, password="test")

        resp = self.add_to_cart([(self.normal_class, 2), (self.premium_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 2)
        self.assertEqual(self.cart_quantity(cart, self.premium_class), 1)

        # Remove all but one normal and the only premium
        resp = self.remove_from_cart([(self.normal_class, 1), (self.premium_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json()["cart_id"], str(cart.id))

        self.assertEqual(self.cart_quantity(cart, self.normal_class), 1)
        self.assertEqual(self.cart_quantity(cart, self.premium_class), 0)
        self.assertFalse(cart.items.filter(ticket_class=self.premium_class).exists())

    def test_remove_from_cart_extra(self):
        self.client.login(username=self.user1.username, password="test")

        resp = self.add_to_cart([(self.normal_class, 2), (self.premium_class, 1)])
        self.assertEqual(resp.status_code, 200, resp.content)

        # Remove more than what exists...still ok.
        resp = self.remove_from_cart(
            [(self.normal_class, 200), (self.premium_class, 100)]
        )
        self.assertEqual(resp.status_code, 200, resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.items.count(), 0)

    def test_remove_from_cart_no_cart(self):
        self.client.login(username=self.user1.username, password="test")
        resp = self.remove_from_cart([(self.normal_class, 1)])
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_delete_event_with_sold_tickets(self):
        sell_tickets(self.normal_class, owner=self.user1)

        self.client.login(username=self.user1.username, password="test")
        resp = self.client.delete(self.showing_url("detail"))
        self.assertEqual(resp.status_code, 400, resp.content)

        resp = self.client.delete(
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk))
        )
        self.assertEqual(resp.status_code, 400, resp.content)

    def test_delete_showing_with_unsold_ticket_classes(self):
        # Carts and unsold inventory should not block deletion
        self.client.login(username=self.user1.username, password="test")
        resp = self.add_to_cart([(self.normal_class, 2)])
        self.assertEqual(resp.status_code, 200, resp.content)

        resp = self.client.delete(self.showing_url("detail"))
        self.assertEqual(resp.status_code, 204, resp.content)
        self.assertFalse(TicketClass.objects.filter(name="premium").exists())
        self.assertFalse(Cart.objects.filter(owner=self.user1).exists())


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


class TicketTestCase(TicketingTestMixin, TestCase):
    """
    Test cases related to the methods on the TicketViewSet
    that correspond to the ticketing project:

    get, list, cart, initiate_checkout, payment_complete, transfer
    """

    def setUp(self):
        commonSetUp(self)

    def initiate_checkout(self, cart_id, **extra):
        return self.client.post(
            reverse("tickets-initiate-checkout"),
            {"cart_id": str(cart_id), **extra},
            format="json",
        )

    def fill_cart(self, quantities, showing=None):
        resp = self.add_to_cart(quantities, showing=showing)
        self.assertEqual(resp.status_code, 200, resp.content)
        return Cart.objects.get(id=resp.json()["cart_id"])

    def test_get_ticket_owned_by_me(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = sell_tickets(self.normal_class, owner=self.user2)[0]

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
        for field in ["price", "id", "ticket_type", "owner", "owner_email", "event"]:
            self.assertIn(field, data, data)
        self.assertEqual(data["ticket_type"], "normal")
        self.assertEqual(data["price"], "15.00")
        self.assertEqual(data["owner"], self.user1.get_full_name())

    def test_list_tickets_owned_by_me(self):
        self.client.login(username=self.user1.username, password="test")

        # Fail to get when not owned
        resp = self.client.get(reverse("tickets-list"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json(), [], resp)

        # List all 5 tickets when owned
        sell_tickets(self.normal_class, owner=self.user1, quantity=5)
        sell_tickets(self.normal_class, owner=self.user2, quantity=2)

        resp = self.client.get(reverse("tickets-list"), format="json")
        data = resp.json()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(len(data), 5, data)

    def test_list_tickets_anonymous(self):
        resp = self.client.get(reverse("tickets-list"), format="json")
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_get_carts(self):
        self.client.login(username=self.user1.username, password="test")

        # No carts yet
        resp = self.client.get(reverse("tickets-cart"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json(), [])

        cart = self.fill_cart([(self.normal_class, 2), (self.premium_class, 1)])

        # Another user's cart is not visible
        other = Cart.objects.create(showing=self.event_showing1, owner=self.user2)
        CartItem.objects.create(cart=other, ticket_class=self.normal_class, quantity=1)

        resp = self.client.get(reverse("tickets-cart"), format="json")
        data = resp.json()
        self.assertEqual(len(data), 1, data)
        self.assertEqual(data[0]["id"], str(cart.id))
        self.assertEqual(data[0]["showing"]["id"], self.event_showing1.id)
        self.assertEqual(data[0]["event"]["id"], self.event1.id)
        self.assertEqual(data[0]["total"], "60.00")
        items = {item["ticket_class"]["name"]: item for item in data[0]["items"]}
        self.assertEqual(items["normal"]["quantity"], 2)
        self.assertEqual(items["normal"]["total_price"], "30.00")
        self.assertEqual(items["premium"]["quantity"], 1)

    def test_get_carts_guest(self):
        # Without a session there is nothing to show
        resp = self.client.get(reverse("tickets-cart"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual(resp.json(), [])

        cart = self.fill_cart([(self.normal_class, 1)])
        resp = self.client.get(reverse("tickets-cart"), format="json")
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertEqual([c["id"] for c in resp.json()], [str(cart.id)])

    def test_cart_total_with_group_discount(self):
        group_class = TicketClass.objects.create(
            showing=self.event_showing1,
            name="group",
            price=Decimal("10.00"),
            quantity=10,
            remaining=10,
            group_size=2,
            group_discount=Decimal("0.20"),
        )
        cart = Cart.objects.create(showing=self.event_showing1, owner=self.user1)
        item = CartItem.objects.create(cart=cart, ticket_class=group_class, quantity=1)

        # 1 ticket, shouldn't activate group discount
        self.assertEqual(item.total_price(), Decimal("10.00"))

        # 5 tickets, enough to activate group discount
        item.quantity = 5
        item.save()
        # 5 * price=10 * (1 - group_discount=0.2) = 40
        self.assertEqual(item.total_price(), Decimal("40.00"))

        # Discounts apply per ticket class
        CartItem.objects.create(cart=cart, ticket_class=self.normal_class, quantity=1)
        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(self.showing_url("cart"))
        self.assertEqual(resp.json()["total"], "55.00")

    def test_give_tickets(self):
        from clubs.views import TicketViewSet

        cart = Cart.objects.create(showing=self.event_showing1, owner=self.user1)
        CartItem.objects.create(cart=cart, ticket_class=self.normal_class, quantity=3)
        items = list(cart.items.select_related("ticket_class"))

        transaction_uuid = uuid4()
        order_info = {
            "total_amount": Decimal("45.00"),
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

        TicketViewSet._give_tickets(self.user1, order_info, cart, items)

        # Tickets are created for the owner and inventory is decremented
        tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(tickets.count(), 3)
        for ticket in tickets:
            self.assertEqual(ticket.ticket_class, self.normal_class)
            self.assertEqual(ticket.owner_email, self.user1.email)
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 17)

        # The cart is consumed
        self.assertFalse(Cart.objects.filter(id=cart.id).exists())

        # Check that transaction record is created
        record = TicketTransactionRecord.objects.get(transaction_uuid=transaction_uuid)
        self.assertEqual(record.total_amount, Decimal("45.00"))
        self.assertEqual(record.tickets.count(), 3)

        # Check that confirmation emails were sent
        self.assertEqual(len(mail.outbox), 3)
        for msg in mail.outbox:
            self.assertIn(
                f"Ticket confirmation for {self.user1.first_name} "
                f"{self.user1.last_name}",
                msg.subject,
            )
            self.assertEqual(msg.to, [self.user1.email])
            self.assertIn(self.user1.first_name, msg.body)
            self.assertIn(self.event1.name, msg.body)
            self.assertIsNotNone(msg.attachments)

    def test_initiate_checkout_non_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1), (self.premium_class, 1)])

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()

        # No free tickets should be sold
        self.assertFalse(data["sold_free_tickets"])

        # Verify response contains CyberSource payment params
        self.assertTrue(data["success"])
        self.assertIn("cybersource_url", data)
        params = data["payment_params"]
        self.assertIn("signature", params)
        self.assertEqual(params["amount"], "45.00")
        self.assertEqual(params["bill_to_forename"], self.user1.first_name)
        self.assertEqual(params["bill_to_surname"], self.user1.last_name)
        self.assertEqual(params["bill_to_email"], self.user1.email)
        self.assertEqual(params["reference_number"], params["transaction_uuid"])

        # Transaction UUID should be tied to cart
        cart.refresh_from_db()
        self.assertEqual(str(cart.pending_transaction_uuid), params["transaction_uuid"])

        # Nothing is sold or reserved until payment completes
        self.assertFalse(Ticket.objects.exists())
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 20)
        self.assertEqual(cart.items.count(), 2)

    def test_initiate_checkout_free_and_non_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        free_class = TicketClass.objects.create(
            showing=self.event_showing1,
            name="free",
            price=Decimal("0.00"),
            quantity=5,
            remaining=5,
        )
        cart = self.fill_cart(
            [(free_class, 1), (self.normal_class, 1), (self.premium_class, 1)]
        )

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()

        # Free ticket should be sold with non-free tickets if purchased together
        self.assertFalse(data["sold_free_tickets"])
        self.assertTrue(data["success"])
        self.assertEqual(data["payment_params"]["amount"], "45.00")
        self.assertFalse(Ticket.objects.exists())

    def test_initiate_checkout_only_free_tickets(self):
        self.client.login(username=self.user1.username, password="test")
        free_class = TicketClass.objects.create(
            showing=self.event_showing1,
            name="free",
            price=Decimal("0.00"),
            quantity=5,
            remaining=5,
        )
        cart = self.fill_cart([(free_class, 3)])

        # Initiate checkout - free tickets are sold immediately
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["sold_free_tickets"])

        # Ownership transferred and inventory decremented
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 3, owned_tickets)
        free_class.refresh_from_db()
        self.assertEqual(free_class.remaining, 2)

        # Cart consumed
        self.assertFalse(Cart.objects.filter(id=cart.id).exists())

        # Check that transaction record is created with null transaction_uuid
        # (free tickets don't go through CyberSource)
        record = TicketTransactionRecord.objects.get(transaction_uuid__isnull=True)
        self.assertEqual(record.total_amount, Decimal("0.00"))
        self.assertEqual(record.buyer_email, self.user1.email)

        self.assertEqual(len(mail.outbox), 3)

    def test_initiate_checkout_guest_free_tickets(self):
        free_class = TicketClass.objects.create(
            showing=self.event_showing1,
            name="free",
            price=Decimal("0.00"),
            quantity=5,
            remaining=5,
        )
        cart = self.fill_cart([(free_class, 2)])
        self.assertIsNone(cart.owner)

        # Guests must provide their details
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("first_name", resp.json()["detail"])

        resp = self.initiate_checkout(
            cart.id, first_name="Guest", last_name="User", email="not-an-email"
        )
        self.assertEqual(resp.status_code, 400, resp.content)

        resp = self.initiate_checkout(
            cart.id, first_name="Guest", last_name="User", email="guest@example.com"
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(resp.json()["sold_free_tickets"])

        tickets = Ticket.objects.filter(owner_email="guest@example.com")
        self.assertEqual(tickets.count(), 2)
        for ticket in tickets:
            self.assertIsNone(ticket.owner)
            self.assertEqual(ticket.get_owner_full_name(), "Guest User")

        record = tickets.first().transaction_record
        self.assertEqual(record.buyer_first_name, "Guest")
        self.assertEqual(record.buyer_email, "guest@example.com")

        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].to, ["guest@example.com"])

    def test_initiate_checkout_guest_paid_tickets(self):
        cart = self.fill_cart([(self.normal_class, 2)])

        resp = self.initiate_checkout(
            cart.id, first_name="Guest", last_name="User", email="guest@example.com"
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        params = resp.json()["payment_params"]
        self.assertEqual(params["amount"], "30.00")
        self.assertEqual(params["bill_to_forename"], "Guest")
        self.assertEqual(params["bill_to_email"], "guest@example.com")

        cart.refresh_from_db()
        self.assertEqual(str(cart.pending_transaction_uuid), params["transaction_uuid"])

    def test_initiate_checkout_after_ticket_drop_time_edit(self):
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1)])

        # Set drop time ahead of current time
        self.event_showing1.ticket_drop_time = timezone.now() + timezone.timedelta(
            hours=12
        )
        self.event_showing1.save()

        # Initiate checkout - should fail because ticket drop time hasn't passed
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_initiate_checkout_elapsed_event(self):
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1)])

        self.event_showing1.end_time = timezone.now() - timezone.timedelta(hours=1)
        self.event_showing1.save()

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 403, resp.content)

    def test_initiate_concurrent_checkouts(self):
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1), (self.premium_class, 1)])

        # Initiate first checkout
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        transaction_uuid_1 = resp.json()["payment_params"]["transaction_uuid"]

        cart.refresh_from_db()
        self.assertEqual(str(cart.pending_transaction_uuid), transaction_uuid_1)

        # Initiate second checkout
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        transaction_uuid_2 = resp.json()["payment_params"]["transaction_uuid"]

        cart.refresh_from_db()
        self.assertEqual(str(cart.pending_transaction_uuid), transaction_uuid_2)

        # Stored transaction UUID should change between checkouts
        self.assertNotEqual(transaction_uuid_1, transaction_uuid_2)

    def test_initiate_checkout_fails_with_empty_cart(self):
        self.client.login(username=self.user1.username, password="test")
        cart = Cart.objects.create(showing=self.event_showing1, owner=self.user1)

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 400, resp.content)
        self.assertIn("No tickets selected", resp.json()["detail"])

    def test_initiate_checkout_invalid_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Missing / malformed cart id
        resp = self.client.post(reverse("tickets-initiate-checkout"), {}, format="json")
        self.assertEqual(resp.status_code, 400, resp.content)
        resp = self.initiate_checkout("not-a-uuid")
        self.assertEqual(resp.status_code, 400, resp.content)

        # Nonexistent cart
        resp = self.initiate_checkout(uuid4())
        self.assertEqual(resp.status_code, 404, resp.content)

        # Someone else's cart
        other = Cart.objects.create(showing=self.event_showing1, owner=self.user2)
        CartItem.objects.create(cart=other, ticket_class=self.normal_class, quantity=1)
        resp = self.initiate_checkout(other.id)
        self.assertEqual(resp.status_code, 404, resp.content)

        # A guest cannot check out a user's cart, or another guest's cart
        guest = APIClient()
        resp = guest.post(
            reverse("tickets-initiate-checkout"),
            {
                "cart_id": str(other.id),
                "first_name": "Guest",
                "last_name": "User",
                "email": "guest@example.com",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)

    def test_initiate_checkout_stale_cart(self):
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 5)])

        # In the meantime, someone else buys most of the normal tickets
        sell_tickets(self.normal_class, owner=self.user2, quantity=17)

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 403, resp.content)
        self.assertIn("Not enough tickets of type normal", resp.json()["detail"])

        # Nothing was sold to us, and the cart is untouched so it can be fixed
        self.assertFalse(Ticket.objects.filter(owner=self.user1).exists())
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 5)

        # Reduce the cart to what is left and try again
        resp = self.remove_from_cart([(self.normal_class, 2)])
        self.assertEqual(resp.status_code, 200, resp.content)
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_complete_checkout(self):
        """Test the complete checkout flow with Secure Acceptance"""
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1), (self.premium_class, 1)])

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["sold_free_tickets"])
        transaction_uuid = data["payment_params"]["transaction_uuid"]

        # Simulate CyberSource callback with payment_complete
        mock_response = MockCybersourceResponse(
            transaction_uuid=transaction_uuid, amount="45.00"
        )
        resp = APIClient().post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )

        # Should redirect to success
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("success=true", resp.url)

        # Ownership transferred
        owned_tickets = Ticket.objects.filter(owner=self.user1)
        self.assertEqual(owned_tickets.count(), 2, owned_tickets)
        self.assertEqual(
            owned_tickets.filter(ticket_class=self.normal_class).count(), 1
        )
        self.assertEqual(
            owned_tickets.filter(ticket_class=self.premium_class).count(), 1
        )
        for ticket in owned_tickets:
            self.assertEqual(ticket.owner_email, self.user1.email)

        # Inventory decremented
        self.normal_class.refresh_from_db()
        self.premium_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 19)
        self.assertEqual(self.premium_class.remaining, 9)

        # Cart consumed
        self.assertFalse(Cart.objects.filter(id=cart.id).exists())

        # Check that transaction record is created
        record = TicketTransactionRecord.objects.get(transaction_uuid=transaction_uuid)
        self.assertEqual(record.decision, "ACCEPT")
        self.assertEqual(record.total_amount, Decimal("45.00"))
        self.assertEqual(record.transaction_id, "test_transaction_123")
        self.assertEqual(record.tickets.count(), 2)

        self.assertEqual(len(mail.outbox), 2)

    def test_complete_checkout_guest(self):
        cart = self.fill_cart([(self.normal_class, 2)])

        resp = self.initiate_checkout(
            cart.id, first_name="Guest", last_name="User", email="guest@example.com"
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        transaction_uuid = resp.json()["payment_params"]["transaction_uuid"]

        mock_response = MockCybersourceResponse(
            transaction_uuid=transaction_uuid,
            amount="30.00",
            first_name="Guest",
            last_name="User",
            email="guest@example.com",
        )
        resp = APIClient().post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("success=true", resp.url)

        tickets = Ticket.objects.filter(owner_email="guest@example.com")
        self.assertEqual(tickets.count(), 2)
        for ticket in tickets:
            self.assertIsNone(ticket.owner)
            self.assertEqual(ticket.get_owner_full_name(), "Guest User")

        record = TicketTransactionRecord.objects.get(transaction_uuid=transaction_uuid)
        self.assertEqual(record.buyer_email, "guest@example.com")

        self.assertEqual(len(mail.outbox), 2)
        for msg in mail.outbox:
            self.assertEqual(msg.to, ["guest@example.com"])
            self.assertIn("Guest", msg.body)

    def test_payment_complete_sold_out_during_payment(self):
        """Test payment completion when inventory ran out during checkout"""
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 2)])

        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)
        transaction_uuid = resp.json()["payment_params"]["transaction_uuid"]

        # Everyone else buys the remaining normal tickets while we're paying
        sell_tickets(self.normal_class, owner=self.user2, quantity=19)

        mock_response = MockCybersourceResponse(
            transaction_uuid=transaction_uuid, amount="30.00"
        )
        with self.assertLogs("clubs.views", level="ERROR"):
            resp = APIClient().post(
                reverse("tickets-payment-complete"),
                mock_response.to_post_params(),
            )

        # Should redirect with an error asking the user to contact support
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("sold%20out", resp.url)
        self.assertIn(transaction_uuid, resp.url)

        # Ownership not transferred and inventory not overdrawn
        self.assertFalse(Ticket.objects.filter(owner=self.user1).exists())
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 1)

        # Cart retained for reconciliation, pending uuid cleared
        cart.refresh_from_db()
        self.assertIsNone(cart.pending_transaction_uuid)

    def test_payment_complete_invalid_signature(self):
        """Test payment completion with invalid signature"""
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 2)])

        resp = self.initiate_checkout(cart.id)
        transaction_uuid = resp.json()["payment_params"]["transaction_uuid"]

        # Create response with invalid signature
        mock_response = MockCybersourceResponse(transaction_uuid=transaction_uuid)
        params = mock_response.to_post_params()
        params["signature"] = "invalid_signature"

        resp = APIClient().post(reverse("tickets-payment-complete"), params)

        # Should redirect with error
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("signature", resp.url.lower())

        # Ownership not transferred
        self.assertFalse(Ticket.objects.exists())
        cart.refresh_from_db()
        self.assertEqual(str(cart.pending_transaction_uuid), transaction_uuid)

    def test_payment_complete_declined(self):
        """Test payment completion when payment is declined"""
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 2)])

        resp = self.initiate_checkout(cart.id)
        transaction_uuid = resp.json()["payment_params"]["transaction_uuid"]

        # Create response with DECLINE decision
        mock_response = MockCybersourceResponse(
            transaction_uuid=transaction_uuid,
            decision="DECLINE",
            reason_code="200",
        )
        resp = APIClient().post(
            reverse("tickets-payment-complete"),
            mock_response.to_post_params(),
        )

        # Should redirect with error
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("declined", resp.url.lower())

        # Ownership not transferred
        self.assertFalse(Ticket.objects.exists())
        self.assertFalse(TicketTransactionRecord.objects.exists())

        # Cart kept so the buyer can retry, with transaction UUID cleared
        cart.refresh_from_db()
        self.assertIsNone(cart.pending_transaction_uuid)
        self.assertEqual(self.cart_quantity(cart, self.normal_class), 2)

        # Retrying works
        resp = self.initiate_checkout(cart.id)
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_payment_complete_duplicate_callback(self):
        """A repeated CyberSource callback must not issue tickets twice"""
        self.client.login(username=self.user1.username, password="test")
        cart = self.fill_cart([(self.normal_class, 1)])

        resp = self.initiate_checkout(cart.id)
        transaction_uuid = resp.json()["payment_params"]["transaction_uuid"]

        params = MockCybersourceResponse(
            transaction_uuid=transaction_uuid, amount="15.00"
        ).to_post_params()

        for _ in range(2):
            resp = APIClient().post(reverse("tickets-payment-complete"), params)
            self.assertEqual(resp.status_code, 302, resp.content)
            self.assertIn("success=true", resp.url)

        self.assertEqual(Ticket.objects.filter(owner=self.user1).count(), 1)
        self.assertEqual(TicketTransactionRecord.objects.count(), 1)
        self.normal_class.refresh_from_db()
        self.assertEqual(self.normal_class.remaining, 19)

    def test_payment_complete_unknown_transaction(self):
        params = MockCybersourceResponse().to_post_params()
        resp = APIClient().post(reverse("tickets-payment-complete"), params)
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("error", resp.url)
        self.assertIn("not%20found", resp.url)

        params = MockCybersourceResponse(transaction_uuid="garbage").to_post_params()
        resp = APIClient().post(reverse("tickets-payment-complete"), params)
        self.assertEqual(resp.status_code, 302, resp.content)
        self.assertIn("Invalid%20transaction", resp.url)

    def test_transfer_ticket(self):
        self.client.login(username=self.user1.username, password="test")
        ticket = sell_tickets(self.normal_class, owner=self.user2)[0]

        # fail to transfer when not owned
        resp = self.client.post(
            reverse("tickets-transfer", args=(ticket.id,)),
            {"username": self.user2.username},
            format="json",
        )
        self.assertEqual(resp.status_code, 404, resp.content)

        ticket.owner = self.user1
        ticket.owner_email = self.user1.email
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
        self.assertEqual(ticket.owner_email, self.user2.email)
        self.assertTrue(
            TicketTransferRecord.objects.filter(
                ticket=ticket, sender=self.user1, receiver=self.user2
            ).exists()
        )

    def test_transfer_non_transferable_ticket(self):
        self.client.login(username=self.user1.username, password="test")
        self.normal_class.transferable = False
        self.normal_class.save()
        ticket = sell_tickets(self.normal_class, owner=self.user1)[0]

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
        ticket = sell_tickets(self.normal_class, owner=self.user1)[0]

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
        ticket = sell_tickets(self.normal_class, owner=self.user2)[0]

        resp = self.client.patch(
            reverse("tickets-detail", args=(ticket.id,)),
            {"attended": True},
            format="json",
        )
        ticket.refresh_from_db()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(ticket.attended)

        # Officers can also check in guest tickets
        guest_ticket = sell_tickets(self.normal_class, owner_email="guest@example.com")[
            0
        ]
        resp = self.client.patch(
            reverse("tickets-detail", args=(guest_ticket.id,)),
            {"attended": True},
            format="json",
        )
        guest_ticket.refresh_from_db()
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(guest_ticket.attended)

    def test_update_attendance_non_officer(self):
        # user1 is no longer an officer for the ticket's club
        self.client.login(username=self.user1.username, password="test")
        ticket = sell_tickets(self.normal_class, owner=self.user1)[0]

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
    Ticket, TicketClass, Cart, TicketTransactionRecord, TicketTransferRecord
    """

    def setUp(self):
        commonSetUp(self)

    def test_price_for_quantity(self):
        self.assertEqual(self.normal_class.price_for_quantity(3), Decimal("45.00"))

        self.normal_class.group_size = 4
        self.normal_class.group_discount = Decimal("0.15")
        self.assertEqual(self.normal_class.price_for_quantity(3), Decimal("45.00"))
        # 4 * 15 * 0.85 = 51
        self.assertEqual(self.normal_class.price_for_quantity(4), Decimal("51.00"))

    def test_ticket_properties(self):
        ticket = sell_tickets(self.normal_class, owner=self.user1)[0]
        self.assertEqual(ticket.showing, self.event_showing1)
        self.assertEqual(ticket.type, "normal")
        self.assertEqual(ticket.price, Decimal("15.00"))
        self.assertTrue(ticket.transferable)
        self.assertEqual(ticket.get_owner_full_name(), "John Adams")
        self.assertEqual(ticket.get_owner_first_name(), "John")

    def test_cart_is_accessible_by(self):
        user_cart = Cart.objects.create(showing=self.event_showing1, owner=self.user1)
        guest_cart = Cart.objects.create(
            showing=self.event_showing1, session_key="guest-session"
        )

        class FakeSession:
            def __init__(self, key):
                self.session_key = key

        class FakeRequest:
            def __init__(self, user, session_key):
                self.user = user
                self.session = FakeSession(session_key)

        from django.contrib.auth.models import AnonymousUser

        self.assertTrue(user_cart.is_accessible_by(FakeRequest(self.user1, None)))
        self.assertFalse(user_cart.is_accessible_by(FakeRequest(self.user2, None)))
        self.assertFalse(
            user_cart.is_accessible_by(FakeRequest(AnonymousUser(), "guest-session"))
        )

        self.assertTrue(
            guest_cart.is_accessible_by(FakeRequest(AnonymousUser(), "guest-session"))
        )
        self.assertFalse(
            guest_cart.is_accessible_by(FakeRequest(AnonymousUser(), "other-session"))
        )
        self.assertFalse(
            guest_cart.is_accessible_by(FakeRequest(AnonymousUser(), None))
        )
        self.assertFalse(
            guest_cart.is_accessible_by(FakeRequest(self.user1, "guest-session"))
        )

    def test_delete_tickets_without_transaction_record(self):
        sell_tickets(self.normal_class, owner=self.user1, quantity=3)
        tickets = Ticket.objects.filter(ticket_class=self.normal_class)
        tickets.delete()
        self.assertFalse(Ticket.objects.filter(ticket_class=self.normal_class).exists())

    def test_delete_ticket_after_purchase(self):
        ticket = sell_tickets(self.normal_class, owner=self.user1)[0]
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
        sell_tickets(self.normal_class, owner=self.user1, quantity=3)
        tickets = Ticket.objects.filter(ticket_class=self.normal_class)
        tickets.update(transaction_record=transaction_record)

        with self.assertRaises(ProtectedError):
            tickets.delete()

    def test_delete_ticket_after_transfer(self):
        ticket = sell_tickets(self.normal_class, owner=self.user2)[0]
        TicketTransferRecord.objects.create(
            ticket=ticket, sender=self.user1, receiver=self.user2
        )

        with self.assertRaises(ProtectedError):
            ticket.delete()

    def test_delete_ticket_class_with_sold_tickets(self):
        sell_tickets(self.normal_class, owner=self.user1)
        with self.assertRaises(ProtectedError):
            self.normal_class.delete()

        # Unsold classes can be removed freely
        self.premium_class.delete()
        self.assertFalse(TicketClass.objects.filter(name="premium").exists())
