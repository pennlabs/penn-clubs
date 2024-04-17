import { Center, Container, Icon } from 'components/common'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'
import { doApiRequest } from 'utils'

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

type TicketProps = InferGetServerSidePropsType<typeof getServerSideProps>

// TODO: Add auth handling gracefully.

const Ticket: React.FC<TicketProps> = ({
  tickets,
  buyers,
  event,
  home,
}): ReactElement => {
  if (home) {
    return (
      <Center>
        Welcome to Ticketing! Please browse events with available tickets{' '}
        <a href="/events">here</a>.
      </Center>
    )
  } else if (!tickets || !tickets.totals || !tickets.available) {
    return <Center>No tickets found with given user permissions.</Center>
  }
  const { totals, available } = tickets
  const tickTypes = {}

  // For given ticket type, get the total and available tickets, as well as buyers
  for (const ticket of totals) {
    tickTypes[ticket.type] = {
      type: ticket.type,
      total: ticket.count,
      price: ticket.price,
      available: 0,
      buyers: [],
    }
  }

  for (const ticket of available) {
    tickTypes[ticket.type].available = ticket.count
  }

  // Public should be able to access info about general tickets metrics, not specific buyers.
  if (buyers.buyers) {
    for (const buyer of buyers.buyers) {
      tickTypes[buyer.type].buyers.push(buyer.fullname)
    }
  }

  return (
    <>
      <Container>
        <Title>All Tickets for {event.name}</Title>
        {Object.values(tickTypes).map((ticket, i) => (
          <TicketCard key={i} ticket={ticket} buyersPerm={buyers.buyers} />
        ))}
      </Container>
    </>
  )
}

const TicketCard = ({ ticket, buyersPerm }) => {
  const [viewBuyers, setViewBuyers] = useState(false)
  return (
    <Card>
      <div
        style={{ display: 'flex', flexDirection: 'column' }}
        onClick={() => {
          setViewBuyers(!viewBuyers)
        }}
      >
        <Title
          style={{
            marginTop: '0px',
            paddingTop: '0px',
            color: 'black',
            opacity: 0.95,
          }}
        >
          {ticket.type}
        </Title>
        <Text>Total Tickets: {ticket.total}</Text>
        <Text>Currently available: {ticket.available}</Text>
        {buyersPerm && (
          <>
            <Text>
              View Buyers{' '}
              {ticket.total && `(${ticket.total - ticket.available})`}{' '}
              {ticket.buyers && (
                <span>
                  <Icon name={viewBuyers ? 'chevron-up' : 'chevron-down'} />
                </span>
              )}
            </Text>

            {viewBuyers && ticket.buyers && (
              <ul style={{ listStyle: 'disc' }}>
                {ticket.buyers.map((buyer) => (
                  <li style={{ marginLeft: '16px' }}>{buyer}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query, req } = context
  const headers = req ? { cookie: req.headers.cookie } : undefined
  if (!query || !query.slug) {
    return { props: { home: true, tickets: {}, event: {}, buyers: {} } }
  }
  const id = query.slug[0]
  try {
    const [ticketsReq, eventReq, buyersReq] = await Promise.all([
      doApiRequest(`/events/${id}/tickets?format=json`, { headers }),
      doApiRequest(`/events/${id}/?format=json`, { headers }),
      doApiRequest(`/events/${id}/buyers?format=json`, { headers }),
    ])

    const [tickets, event, buyers] = await Promise.all([
      ticketsReq.json(),
      eventReq.json(),
      buyersReq.json(),
    ])
    return {
      props: {
        home: false,
        tickets,
        event,
        buyers,
      },
    }
  } catch (error) {
    return { props: { home: true, tickets: {}, event: {}, buyers: {} } }
  }
}

export default Ticket
