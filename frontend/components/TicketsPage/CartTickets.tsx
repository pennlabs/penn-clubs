import { useMemo } from 'react'

import { CountedEventTicket, EventTicket } from '~/types'

export interface CartTicketsProps {
  tickets: EventTicket[]
}

/**
 * Combines an array of tickets into a list of unique ticket types with counts
 * @param tickets - Original array of tickets
 * @returns Array of tickets condensed into unique types
 */
const combineTickets = (tickets: EventTicket[]): CountedEventTicket[] => {
  const tix = [...tickets]
  const out: CountedEventTicket[] = []

  while (tix.length > 0) {
    const currentTicket = tix.pop()
    // TODO
  }

  return out
}

const CartTickets = ({ tickets }: CartTicketsProps) => {
  const condensedTickets = useMemo(() => combineTickets(tickets), [tickets])
  return (
    <ul>
      {tickets.map((ticket) => {
        return <li>{ticket.toString()}</li>
      })}
    </ul>
  )
}

export default CartTickets
