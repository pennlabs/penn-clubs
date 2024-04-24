import { css } from '@emotion/react'
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { EmptyState, Modal, Subtitle, Text } from '~/components/common'
import PaymentForm from '~/components/Tickets/PaymentForm'
import { TicketCard } from '~/components/Tickets/TicketCard'
import { BORDER, BORDER_RADIUS, mediaMaxWidth, SM, WHITE } from '~/constants'
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
              <span key={`count-${ticket.id}`}>{ticket.count} x </span>
              <span key={`name-${ticket.id}`}>{ticket.event.name}</span>
              <span key={`type-${ticket.id}`}>({ticket.type})</span>
              <span key={`price-${ticket.id}`}>${ticket.price}</span>
              <span key={`cost-${ticket.id}`}>
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
  soldOut: CountedEventTicket[]
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

const CartTickets: React.FC<CartTicketsProps> = ({ tickets, soldOut }) => {
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
    soldOut
      .filter((ticket) => ticket.count !== 0)
      .forEach(
        (ticket) => {
          toast.error(
            `${ticket.event.name} - ${ticket.type} is sold out and ${ticket.count} ticket${ticket.count && ticket.count > 1 ? 's have' : ' has'} been removed from your cart.`,
            {
              style: { color: WHITE },
              autoClose: false,
            },
          )
        },
        [soldOut],
      )
  }, [])

  function handleInitiateCheckout() {
    if (countedTickets.length === 0) {
      return
    }
    setShowPaymentForm(true)
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
  }

  function handleUpdateTicket(ticket: CountedEventTicket, newCount?: number) {
    let reqPromise

    if (!ticket.count || newCount === ticket.count) {
      return
    }
    if (newCount && newCount > ticket.count) {
      reqPromise = doApiRequest(`/events/${ticket.event.id}/add_to_cart/`, {
        method: 'POST',
        body: {
          quantities: [
            {
              type: ticket.type,
              count: newCount - ticket.count,
            },
          ],
        },
      })
    } else {
      reqPromise = doApiRequest(
        `/events/${ticket.event.id}/remove_from_cart/`,
        {
          method: 'POST',
          body: {
            quantities: [
              {
                type: ticket.type,
                // If count is not provided, remove all tickets
                count: newCount ? ticket.count! - newCount : ticket.count,
              },
            ],
          },
        },
      )
    }
    reqPromise
      .then((resp) => resp.json())
      .then((res) => {
        if (!res.success) {
          // eslint-disable-next-line no-console
          toast.error(res.detail, {
            style: { color: WHITE },
          })
          return
        }
        toast.success(res.detail)
        // TODO: a less naive approach to updating the cart
        setCountedTickets(
          countedTickets
            .map((t) => (t.id === ticket.id ? { ...t, count: newCount } : t))
            .filter((t) => t.count !== 0),
        )
      })
  }

  if (countedTickets.length === 0) {
    return (
      <div
        css={css`
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 1rem;
          background: ${WHITE};
          border: 1px solid ${BORDER};
          border-radius: ${BORDER_RADIUS};

          ${mediaMaxWidth(SM)} {
            flex-direction: column;
          }
        `}
      >
        <EmptyState name="empty_cart_two" />
        <div
          style={{
            padding: '1rem',
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Subtitle>Your cart is empty</Subtitle>
          <Text isGray>
            To add tickets to your cart, visit the event page and select the
            tickets you wish to purchase. If you believe this is an error,
            please contact support at
            <a href="mailto:contact@pennlabs.org" className="ml-1">
              contact@pennlabs.org
            </a>
            .
          </Text>
        </div>
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
                  handleUpdateTicket(removeModal!)
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
                handleUpdateTicket(ticket, count)
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
          onClick={() => {
            handleInitiateCheckout()
          }}
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
