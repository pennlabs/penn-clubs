import { css } from '@emotion/react'
import React, { useEffect, useMemo, useState } from 'react'

import { Modal, Subtitle } from '~/components/common'
import PaymentForm from '~/components/Tickets/PaymentForm'
import { TicketCard } from '~/components/Tickets/TicketCard'
import { BORDER, BORDER_RADIUS, WHITE } from '~/constants'
import { CountedEventTicket, EventTicket } from '~/types'
import { doApiRequest } from '~/utils'

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
              <span>{ticket.count} x </span>
              <span>{ticket.event.name}</span>
              <span>({ticket.type})</span>
              <span>${ticket.price}</span>
              <span>
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
  const countedTickets = useMemo(() => combineTickets(tickets), [tickets])

  useEffect(() => {
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

  return (
    <>
      <div>
        <div>
          {countedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              hideActions
              removable
              onRemove={() => {
                // TODO: Remove ticket from cart
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
