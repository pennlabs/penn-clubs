import React, { useMemo, useState } from 'react'
import styled from 'styled-components'

import { TicketCard } from '~/components/Tickets/TicketCard'
import { EventTicket } from '~/types'

export interface CountedEventTicket extends EventTicket {
  count: number
}

export interface CartTicketsProps {
  tickets: EventTicket[]
}

interface TicketImageProps {
  url: string | null
}

const THUMBNAIL_SIZE = '40px'

const Thumbnail = styled.div<TicketImageProps>`
  width: ${THUMBNAIL_SIZE};
  height: ${THUMBNAIL_SIZE};
  margin: 8px;

  background-image: url(${({ url }) => url || '/static/img/tickets.png'});
  background-size: contain;
  border-radius: 3px;
`

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
  const countedTickets = useMemo(() => combineTickets(tickets), [tickets])

  return (
    <>
      {countedTickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} hideActions />
      ))}
      {/* <PaymentForm /> */}
    </>
  )
}

export default CartTickets
