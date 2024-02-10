import { Center, Container, Icon } from 'components/common'
import { NextPageContext } from 'next'
import { ReactElement, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { doApiRequest } from 'utils'

import { EventTicket } from '~/types'

import { ALLBIRDS_GRAY, HOVER_GRAY, WHITE } from '../../constants/colors'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  mediaMaxWidth,
  SM,
} from '../../constants/measurements'

type CardProps = {
  readonly hovering?: boolean
  className?: string
}

type TicketsResponse = {
  totals: EventTicket[]
  available: EventTicket[]
}

type Buyer = {
  fullname: string
  id: string
  ownerId: string
  type: string
}

type BuyerResponse = {
  buyers: Buyer[]
}

const Card = styled.div<CardProps>`
  padding: 10px;
  margin-top: 1rem;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: auto;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const Title = styled.h1`
  font-weight: 600;
  font-size: 2rem;
  margin: 1rem 0rem;
`

const Text = styled.h1`
  font-weight: 400;
  font-size: 1rem;
  margin: 0.5rem 0rem;
`
// TODO: Add auth handling gracefully.

const Ticket = ({ tickets, buyers, event, home }): ReactElement => {
  // const Ticket = ({ event }): ReactElement => {

  if (home) {
    return (
      <Center>
        Welcome to Ticketing! Please browse events with available tickets{' '}
        <a href="/events">here</a>.
      </Center>
    )
  } else if (!tickets.totals) {
    return <Center>No tickets found with given user permissions.</Center>
  }
  const { totals, available } = tickets
  const ticks = {}
  totals.forEach((tick) => {
    if (ticks[tick.type] == null) {
      ticks[tick.type] = { type: tick.type }
    }
    ticks[tick.type].total = tick.count
  })

  available.forEach((tick) => {
    if (ticks[tick.type] == null) {
      ticks[tick.type] = { type: tick.type }
    }
    ticks[tick.type].available = tick.count
  })

  buyers.forEach((tick) => {
    if (ticks[tick.type] == null) {
      ticks[tick.type] = { type: tick.type }
    }
    if (ticks[tick.type].buyers == null) {
      ticks[tick.type].buyers = []
    }

    ticks[tick.type].buyers.push(tick.fullname)
  })

  tickets = []
  for (const [_, value] of Object.entries(ticks)) {
    tickets.push(value)
  }

  return (
    <>
      <Container>
        <Title>All Tickets for {event.name}</Title>
        {tickets.map((ticket, i) => (
          <TicketCard key={i} ticket={ticket} />
        ))}
      </Container>
    </>
  )
}

const TicketCard = ({ ticket }) => {
  const [viewBuyers, setViewBuyers] = useState(false)
  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title style={{ marginTop: '1rem', color: 'black', opacity: 0.95 }}>
          {ticket.type}
        </Title>
        <Text>Total Tickets: {ticket.total}</Text>
        <Text>Currently available: {ticket.available}</Text>
        <Text
          onClick={() => {
            setViewBuyers(!viewBuyers)
          }}
        >
          View Buyers {ticket.total && `(${ticket.total - ticket.available})`}{' '}
          {ticket.buyers && (
            <span>
              <Icon name={viewBuyers ? 'chevron-up' : 'chevron-down'} />
            </span>
          )}
        </Text>

        {viewBuyers &&
          ticket.buyers &&
          ticket.buyers.map((buyer) => <li>{buyer}</li>)}
      </div>
    </Card>
  )
}

Ticket.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  try {
    if (!query || !query.slug) {
      return { home: true }
    }
    const id = query && query.slug ? query.slug[0] : -1
    const [ticketsReq, eventReq, buyersReq] = await Promise.all([
      doApiRequest(`/events/${id}/tickets?format=json`, data),
      doApiRequest(`/events/${id}/?format=json`, data),
      doApiRequest(`/events/${id}/buyers?format=json`, data),
    ])

    const ticketsRes = await ticketsReq.json()
    const eventRes = await eventReq.json()
    const buyersRes = await buyersReq.json()

    // console.log('ticketsRes', ticketsRes)
    // console.log('eventRes', eventRes)
    // console.log('buyersRes', buyersRes)
    // console.log('buyersRes.buyers', buyersRes.buyers)

    return { tickets: ticketsRes, event: eventRes, buyers: buyersRes.buyers }
  } catch (err) {
    // console.log(err)
  }
}

/*
Ticket.getInitialProps = async ({ query }): Promise<any> => {
 const id = query.slug[0]
 return doApiRequest(`/events/${id}/tickets?format=json`, {
   method: 'GET',
 })
   .then((resp) => resp.json())
   .then((res) => {
     console.log(res)
   })
}
*/

export default renderPage(Ticket)
