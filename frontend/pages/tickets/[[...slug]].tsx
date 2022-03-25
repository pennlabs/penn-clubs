import { ReactElement, useState } from 'react'
import { Container, Icon } from 'components/common'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { doApiRequest } from 'utils'
import { NextPageContext } from 'next'
import {
  ALLBIRDS_GRAY,
  CLUBS_GREY_LIGHT,
  H1_TEXT,
  HOVER_GRAY,
  WHITE,
} from '../../constants/colors'
import {
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CARD_HEADING,
  mediaMaxWidth,
  SM,
} from '../../constants/measurements'

type CardProps = {
  readonly hovering?: boolean
  className?: string
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

//const Ticket = ({ totals, available, buyers }): ReactElement => {
const Ticket = ({ event }): ReactElement => {
  const tickets = [
    {
      name: 'Premium',
      total: 20,
      available: 17,
      buyers: ['Mohamed', 'Rohan', 'Campel'],
    },
    { name: 'Front Seat', total: 30, available: 29, buyers: ['David1'] },
    {
      name: 'Regular',
      total: 200,
      available: 191,
      buyers: [
        'Mohamed',
        'Rohan',
        'Campel',
        'Mohamed',
        'Rohan',
        'Campel',
        'Mohamed',
        'Rohan',
        'Campel',
        'Mohamed',
        'Rohan',
        'Campel',
      ],
    },
  ]
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
          {ticket.name}
        </Title>
        <Text>Total Tickets: {ticket.total}</Text>
        <Text>Currently avaialble: {ticket.available}</Text>
        <Text
          onClick={() => {
            setViewBuyers(!viewBuyers)
          }}
        >
          View Buyers ({ticket.total - ticket.available}){' '}
          <span>
            <Icon name={viewBuyers ? 'chevron-up' : 'chevron-down'} />
          </span>
        </Text>

        {viewBuyers && ticket.buyers.map((buyer) => <li>{buyer}</li>)}
      </div>
    </Card>
  )
}

Ticket.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const id = query && query.slug ? query.slug[0] : 0
  const [ticketsReq, eventReq] = await Promise.all([
    doApiRequest(`/events/${id}/tickets?format=json`, data),
    doApiRequest(`/events/${id}/?format=json`, data),
  ])

  const ticketsRes = await ticketsReq.json()
  const eventRes = await eventReq.json()

  return { tickets: ticketsRes, event: eventRes }
}

// Ticket.getInitialProps = async ({ query }): Promise<any> => {
//   const id = query.slug[0]
//   return doApiRequest(`/events/${id}/tickets?format=json`, {
//     method: 'GET',
//   })
//     .then((resp) => resp.json())
//     .then((res) => {
//       return res
//     })
// }

export default renderPage(Ticket)
