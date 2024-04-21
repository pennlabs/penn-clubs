import json
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import timedelta
from unittest.mock import patch

import freezegun
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import Cart, Club, Event, Ticket, TicketTransactionRecord


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
    Test cases related to the methods on the EventViewSet
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
            "delay_drop": True,
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
        self.assertEqual(data["sold_out"], 0, data)

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
        self.assertEqual(data["sold_out"], 0, data)

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

        # 2 tickets have been sold out
        self.assertEqual(data["sold_out"], 2, data)

        in_cart = set(map(lambda t: t["id"], data["tickets"]))
        to_add = set(map(lambda t: str(t.id), tickets_to_add))

        # 0 tickets are the same (we sell all but last 3)
        self.assertEqual(len(in_cart & to_add), 0, in_cart | to_add)

    def test_initiate_checkout(self):
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
            fake_cap_context.return_value = "abcde", 200, None
            resp = self.client.post(reverse("tickets-initiate-checkout"))
            self.assertIn(resp.status_code, [200, 201], resp.content)

        # Tickets are held
        held_tickets = Ticket.objects.filter(holder=self.user1)
        self.assertEqual(held_tickets.count(), 2, held_tickets)
        self.assertEqual(held_tickets.filter(type="normal").count(), 1, held_tickets)
        self.assertEqual(held_tickets.filter(type="premium").count(), 1, held_tickets)

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

            resp = self.client.post(
                reverse("tickets-complete-checkout"),
                {"transient_token": "abcdefg"},
                format="json",
            )
            self.assertIn(resp.status_code, [200, 201], resp.content)
            self.assertIn("Payment successful", resp.data["detail"], resp.data)

            # Ownership transfered
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 2, owned_tickets)

            # Cart empty
            user_cart = Cart.objects.get(owner=self.user1)
            self.assertEqual(user_cart.tickets.count(), 0, user_cart)

            # Tickets held is 0
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)

            # Transaction record created
            TicketTransactionRecord.objects.filter(
                reconciliation_id=MockPaymentResponse().reconciliation_id
            ).exists()

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

            # Ownership not transfered
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

            # Ownership not transfered
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

            # Ownership not transfered
            owned_tickets = Ticket.objects.filter(owner=self.user1)
            self.assertEqual(owned_tickets.count(), 0, owned_tickets)

            # Hold cancelled
            held_tickets = Ticket.objects.filter(holder=self.user1)
            self.assertEqual(held_tickets.count(), 0, held_tickets)
