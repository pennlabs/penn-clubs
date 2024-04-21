import { css } from '@emotion/react'
import React, { useEffect, useState } from 'react'

import { Modal, Subtitle } from '~/components/common'
import PaymentForm from '~/components/Tickets/PaymentForm'
import { TicketCard } from '~/components/Tickets/TicketCard'
import { BORDER, BORDER_RADIUS, WHITE } from '~/constants'
import { CountedEventTicket, EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

import { ModalContent } from '../ClubPage/Actions'

const Summary: React.FC<{ tickets: CountedEventTicket[] }> = ({ tickets }) => {
  return (
    <>
      <Subtitle>Summary</Subtitle>
      <div
        css={css`
          padding: 12px;
          background: ${WHITE};
          border: 1px solid ${BORDER};
          border-radius: ${BORDER_RADIUS};
        `}
      >
        <div
          css={css`
            display: grid;
            grid-template-columns: 2fr 4fr 4fr 2fr 2fr;
          `}
        >
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Qty
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Event
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Type
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Price
          </span>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            Total
          </span>
          {tickets.map((ticket) => (
            <>
              <span key={ticket.id}>{ticket.count} x </span>
              <span key={ticket.id}>{ticket.event.name}</span>
              <span key={ticket.id}>({ticket.type})</span>
              <span key={ticket.id}>${ticket.price}</span>
              <span key={ticket.id}>
                ${(Number(ticket.price) * (ticket.count ?? 1)).toFixed(2)}
              </span>
            </>
          ))}
        </div>
        <hr
          css={css`
            margin-top: 12px;
            margin-bottom: 12px;
            border-top: 1px solid ${BORDER};
          `}
        />
        <div
          css={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          <span>Total</span>
          <span>
            $
            {tickets
              .map((ticket) => Number(ticket.price) * (ticket.count ?? 1))
              .reduce((acc, curr) => acc + curr, 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
    </>
  )
}

export interface CartTicketsProps {
  tickets: EventTicket[]
}

/**
 * Combines an array of tickets into a list of unique ticket types with counts
 * @param tickets - Original array of tickets
 * @returns Array of tickets condensed into unique types
 */
const combineTickets = (tickets: EventTicket[]): CountedEventTicket[] =>
  Object.values(
    tickets.reduce(
      (acc, ticket) => ({
        ...acc,
        [`${ticket.event.id}_${ticket.type}`]: {
          ...ticket,
          count: (acc[`${ticket.event.id}_${ticket.type}`]?.count ?? 0) + 1,
        },
      }),
      {},
    ),
  )

const CartTickets: React.FC<CartTicketsProps> = ({ tickets }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [token, setToken] = useState('')
  const [removeModal, setRemoveModal] = useState<CountedEventTicket | null>(
    null,
  )

  const [countedTickets, setCountedTickets] = useState<CountedEventTicket[]>([])
  useEffect(() => {
    setCountedTickets(combineTickets(tickets))
  }, [tickets])

  useEffect(() => {
    if (countedTickets.length === 0) {
      return
    }
    doApiRequest(`/tickets/initiate_checkout/?format=json`, {
      method: 'POST',
      body: { tickets: countedTickets },
    })
      .then((resp) => resp.json())
      .then((res) => {
        if (!res.success) {
          // eslint-disable-next-line no-console
          console.error(res.detail)
          return
        }
        setToken(res.detail)
      })
  }, [countedTickets])

  function handleRemoveTicket(ticket: CountedEventTicket, newCount?: number) {
    doApiRequest(
      `/clubs/${ticket.event.club}/events/${ticket.event.id}/remove_from_cart/`,
      {
        method: 'POST',
        body: {
          quantities: [
            {
              type: ticket.type,
              // If count is not provided, remove all tickets
              count: newCount ?? ticket.count,
            },
          ],
        },
      },
    )
      .then((resp) => resp.json())
      .then((res) => {
        if (!res.success) {
          // eslint-disable-next-line no-console
          console.error(res.detail)
          return
        }
        // TODO: a less naive approach to updating the cart
        setCountedTickets(
          countedTickets
            .map((t) =>
              t.id === ticket.id
                ? { ...t, count: t.count! - (newCount ?? t.count!) }
                : t,
            )
            .filter((t) => t.count !== 0),
        )
      })
  }

  if (countedTickets.length === 0) {
    return (
      <div>
        <Subtitle>Your cart is empty</Subtitle>
        <p>
          To add tickets to your cart, visit the event page and select the
          tickets you wish to purchase.
          <br />
          If you believe this is an error, please contact support at
          <a href="mailto:contact@pennlabs.org" className="ml-1">
            contact@pennlabs.org
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <>
      <div>
        <Modal show={removeModal !== null}>
          <ModalContent>
            <Subtitle>Remove Ticket</Subtitle>
            <p>
              Are you sure you want to remove this ticket for{' '}
              {removeModal?.event.name}?
            </p>
            <div className="buttons">
              <button
                className="button is-danger"
                onClick={() => {
                  handleRemoveTicket(removeModal!)
                  setRemoveModal(null)
                }}
              >
                Remove
              </button>
              <button
                className="button"
                onClick={() => {
                  setRemoveModal(null)
                }}
              >
                Cancel
              </button>
            </div>
          </ModalContent>
        </Modal>
        <div>
          {countedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              hideActions
              removable
              editable
              onChange={(count) => {
                handleRemoveTicket(ticket, count)
              }}
              onRemove={() => {
                setRemoveModal(ticket)
              }}
            />
          ))}
        </div>
        <Summary tickets={countedTickets} />
        <button
          className="button is-primary is-fullwidth mt-4"
          onClick={() => setShowPaymentForm(true)}
        >
          Proceed to Checkout
        </button>
      </div>
      <Modal show={showPaymentForm}>
        {token && <PaymentForm token={token} />}
      </Modal>
    </>
  )
}

export default CartTickets
