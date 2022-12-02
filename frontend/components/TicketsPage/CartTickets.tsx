import { ReactElement, useMemo } from 'react'
import styled from 'styled-components'

import { CARD_HEADING, CLUBS_GREY, H1_TEXT } from '~/constants'
import { EventTicket } from '~/types'

import { Card } from '../common'

export interface CountedEventTicket extends EventTicket {
  count: number
}

export interface CartTicketsProps {
  tickets: EventTicket[]
}

const TicketCard = styled(Card)`
  display: flex;
  flex-direction: row;
`

const Body = styled.div`
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const XButton = styled.button`
  width: 14px;
  height: 14px;
`

const EventTitle = styled.strong`
  font-size: 1.3rem;
  line-height: 1.2;
  color: ${H1_TEXT};
  margin-bottom: 0.5rem;
  font-weight: ${CARD_HEADING};
`

const ClubName = styled.div`
  color: ${CLUBS_GREY};
`

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

// TODO: use ticket type as well
const ticketKey = (t1: EventTicket) => t1.event.id

/**
 * Combines an array of tickets into a list of unique ticket types with counts
 * @param tickets - Original array of tickets
 * @returns Array of tickets condensed into unique types
 */
const combineTickets = (tickets: EventTicket[]): CountedEventTicket[] => {
  const tix = [...tickets]
  const countedTickets: { [key: string]: CountedEventTicket } = {}

  while (tix.length > 0) {
    const currentTicket = tix.pop() as EventTicket
    const key = ticketKey(currentTicket)
    if (countedTickets[key] === undefined) {
      countedTickets[key] = { ...currentTicket, count: 1 }
    } else {
      countedTickets[key].count += 1
    }
  }

  return Object.values(countedTickets)
}

const CartTickets = ({ tickets }: CartTicketsProps): ReactElement => {
  const condensedTickets = useMemo(() => combineTickets(tickets), [tickets])
  console.log(condensedTickets)
  return (
    <ul>
      {condensedTickets.map(({ event, id }) => {
        return (
          <TicketCard key={id}>
            <Thumbnail url={event.image_url} />
            <Body>
              <EventTitle>{event.name}</EventTitle>
              <ClubName>{event.club_name}</ClubName>
            </Body>
          </TicketCard>
        )
      })}
    </ul>
  )
}

export default CartTickets
