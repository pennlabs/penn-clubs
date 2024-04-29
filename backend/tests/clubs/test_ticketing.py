import json
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import timedelta
from unittest.mock import patch

import freezegun
from django.contrib.auth import get_user_model
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
    Membership,
    Ticket,
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

    self.event1 = Event.objects.create(
        code="test-event",
        club=self.club1,
        name="Test Event",
        start_time=timezone.now() + timezone.timedelta(days=2),
        end_time=timezone.now() + timezone.timedelta(days=3),
    )

    self.ticket_totals = [
        {"type": "normal", "count": 20, "price": 15.0},
        {"type": "premium", "count": 10, "price": 30.0},
    ]

    self.tickets1 = [
        Ticket.objects.create(type="normal", event=self.event1, price=15.0)
        for _ in range(20)
    ]
    self.tickets2 = [
        Ticket.objects.create(type="premium", event=self.event1, price=30.0)
        for _ in range(10)
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
        qts = {
            "quantities": [
                {"type": "_normal", "count": 20, "price": 10},
                {"type": "_premium", "count": 10, "price": 20},
            ]
        }

        resp = self.client.put(
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
            qts,
            format="json",
        )

        aggregated_tickets = list(
            Ticket.objects.filter(event=self.event1, type__contains="_")
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

        tickets = [Ticket(type="free", event=self.event1, price=0.0) for _ in range(10)]
        Ticket.objects.bulk_create(tickets)

        qts = {
            "quantities": [
                {"type": "_free", "count": 10, "price": 0},
            ]
        }

        resp = self.client.put(
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
            qts,
            format="json",
        )

        aggregated_tickets = list(
            Ticket.objects.filter(event=self.event1, type__contains="_")
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
                reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
            args,
            format="json",
        )

        self.event1.refresh_from_db()

        # Drop time should be set
        self.assertIsNotNone(self.event1.ticket_drop_time)

        # Drop time should be 12 hours from initial ticket creation
        expected_drop_time = timezone.now() + timezone.timedelta(hours=12)
        diff = abs(self.event1.ticket_drop_time - expected_drop_time)
        self.assertTrue(diff < timezone.timedelta(minutes=5))

        # Move Django's internal clock 13 hours forward
        with freezegun.freeze_time(timezone.now() + timezone.timedelta(hours=13)):
            resp = self.client.put(
                reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
            args,
            format="json",
        )
        self.assertEqual(resp.status_code, 403, resp.content)

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
                "club-events-issue-tickets", args=(self.club1.code, self.event1.pk)
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
                "club-events-issue-tickets", args=(self.club1.code, self.event1.pk)
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
                "club-events-issue-tickets", args=(self.club1.code, self.event1.pk)
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
                "club-events-issue-tickets", args=(self.club1.code, self.event1.pk)
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
                "club-events-issue-tickets", args=(self.club1.code, self.event1.pk)
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

    def test_get_tickets_information_no_tickets(self):
        # Delete all the tickets
        Ticket.objects.all().delete()

        resp = self.client.get(
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
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

    def test_get_tickets_before_drop_time(self):
        self.event1.ticket_drop_time = timezone.now() + timedelta(days=1)
        self.event1.save()

        self.client.login(username=self.user1.username, password="test")
        resp = self.client.get(
            reverse("club-events-tickets", args=(self.club1.code, self.event1.pk)),
        )
        self.assertEqual(resp.status_code, 200, resp.content)
        data = resp.json()

        # Tickets shouldn't be available before the drop time
        self.assertEqual(data["totals"], [])
        self.assertEqual(data["available"], [])

    def test_get_tickets_buyers(self):
        self.client.login(username=self.user1.username, password="test")

        # Buy all normal tickets
        for ticket in self.tickets1:
            ticket.owner = self.user1
            ticket.save()

        resp = self.client.get(
            reverse("club-events-buyers", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-buyers", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
            tickets_to_add,
            format="json",
        )
        self.assertIn(resp.status_code, [200, 201], resp.content)

        cart = Cart.objects.get(owner=self.user1)
        self.assertEqual(cart.tickets.count(), 3, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="normal").count(), 2, cart.tickets)
        self.assertEqual(cart.tickets.filter(type="premium").count(), 1, cart.tickets)

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
                    "club-events-add-to-cart", args=(self.club1.code, self.event1.pk)
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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
        self.event1.ticket_drop_time = timezone.now() + timedelta(hours=12)
        self.event1.save()

        tickets_to_add = {
            "quantities": [
                {"type": "normal", "count": 2},
            ]
        }
        resp = self.client.post(
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
            tickets_to_add,
            format="json",
        )

        # Tickets should not be added to cart before drop time
        self.assertEqual(resp.status_code, 403, resp.content)

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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
                "club-events-remove-from-cart", args=(self.club1.code, self.event1.pk)
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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
                "club-events-remove-from-cart", args=(self.club1.code, self.event1.pk)
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
            reverse("club-events-detail", args=(self.club1.code, self.event1.pk))
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
class MockPaymentResponse:
    status: str = "AUTHORIZED"
    reconciliation_id: str = "abced"


@contextmanager
def mock_cybersource_apis():
    """Mock cybersource APIs and validate_transient_token"""
    with patch(
        ".".join(
            [
                "CyberSource",
                "UnifiedCheckoutCaptureContextApi",
                "generate_unified_checkout_capture_context_with_http_info",
            ]
        )
    ) as fake_cap_context, patch(
        ".".join(
            [
                "CyberSource",
                "TransientTokenDataApi",
                "get_transaction_for_transient_token",
            ]
        )
    ) as fake_get_transaction, patch(
        ".".join(
            [
                "CyberSource",
                "PaymentsApi",
                "create_payment",
            ]
        )
    ) as fake_create_payment, patch(
        "clubs.views.validate_transient_token"
    ) as fake_validate_tt:
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
                event=self.event1,
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
            "event": {
                "id": self.tickets1[0].event.id,
                "name": self.tickets1[0].event.name,
            },
            "count": 2,
        }
        for key, val in expected_sold_out.items():
            self.assertEqual(data["sold_out"][0][key], val, data)

        # 0 tickets are the same (we sell all but last 3)
        in_cart = set(map(lambda t: t["id"], data["tickets"]))
        to_add = set(map(lambda t: str(t.id), tickets_to_add))
        self.assertEqual(len(in_cart & to_add), 0, in_cart | to_add)

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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
        Ticket.objects.create(type="free", event=self.event1, price=0.0)

        # Add a few tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "free", "count": 1},
                {"type": "normal", "count": 1},
                {"type": "premium", "count": 1},
            ]
        }
        resp = self.client.post(
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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

        tickets = [Ticket(type="free", event=self.event1, price=0.0) for _ in range(3)]
        Ticket.objects.bulk_create(tickets)

        # Add a few free tickets to cart
        tickets_to_add = {
            "quantities": [
                {"type": "free", "count": 3},
            ]
        }
        resp = self.client.post(
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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

        # Transaction record created
        record_exists = TicketTransactionRecord.objects.filter(
            reconciliation_id="None"
        ).exists()
        self.assertTrue(record_exists)

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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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
            self.assertEquals(resp.status_code, 400, resp.content)

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
            reverse("club-events-add-to-cart", args=(self.club1.code, self.event1.pk)),
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

            # Transaction record created
            record_exists = TicketTransactionRecord.objects.filter(
                reconciliation_id=MockPaymentResponse().reconciliation_id
            ).exists()
            self.assertTrue(record_exists)

    def test_complete_checkout_stale_cart(self):
        self.client.login(username=self.user1.username, password="test")

        # Add a few tickets to cart
        cart, _ = Cart.objects.get_or_create(owner=self.user1)
        tickets_to_add = self.tickets1[:2]
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
        tickets_to_add = self.tickets1[:2]
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
        tickets_to_add = self.tickets1[:2]
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
    Ticket, TicketTransactionRecord, TicketTransferRecord
    """

    def setUp(self):
        commonSetUp(self)

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
