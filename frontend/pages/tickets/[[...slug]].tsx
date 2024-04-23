import { Center, Container, Icon, Metadata } from 'components/common'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'
import { doApiRequest } from 'utils'

import { BaseLayout } from '~/components/BaseLayout'
import ManageBuyer from '~/components/Tickets/ManageBuyer'
import { createBasePropFetcher } from '~/utils/getBaseProps'

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
  baseProps,
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
      tickTypes[buyer.type].buyers.push(buyer)
    }
  }

  return (
    <>
      <BaseLayout {...baseProps}>
        <Metadata title="Events" />
        <Container>
          <Title>All Tickets for {event.name}</Title>
          {Object.values(tickTypes).map((ticket, i) => (
            <TicketCard
              key={i}
              ticket={ticket as Ticket}
              buyersPerm={buyers.buyers != null}
            />
          ))}
        </Container>
      </BaseLayout>
    </>
  )
}

export type Buyer = {
  id: string
  fullname: string
  owner__email: string
  owner_id: number
  type: string
}

type Ticket = {
  type: string
  total: number
  price: number
  available: number
  buyers: Buyer[]
}

type TicketCardProps = {
  ticket: Ticket
  buyersPerm: boolean
}

const TicketIssueInput = () => {
  const [tags, setTags] = useState([] as string[])
  const [input, setInput] = useState('')

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleInputKeyDown = (e) => {
    const val = input.trim()
    if ((e.key === 'Enter' || e.key === ',') && val) {
      e.preventDefault()
      if (tags.find((tag) => tag.toLowerCase() === val.toLowerCase())) {
        return
      }
      const vals = val.split(/[, ]+/)
      setTags([...tags, ...vals])
      setInput('')
    }
  }

  const removeTag = (i) => {
    const newTags = [...tags]
    newTags.splice(i, 1)
    setTags(newTags)
  }

  return (
    <div>
      <Text>Issue Tickets</Text>
      <input
        type="text"
        placeholder="Enter pennkeys here, separated by commas or spaces"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
      />
      <div className="field is-grouped is-grouped-multiline">
        {tags.map((tag, index) => (
          <div className="control" key={index}>
            <div className="tags has-addons">
              <a className="tag is-link">{tag}</a>
              <a className="tag is-delete" onClick={() => removeTag(index)}></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
const TicketCard = ({ ticket, buyersPerm }: TicketCardProps) => {
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
        <Card>
          <TicketIssueInput />
        </Card>
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
                  <ManageBuyer key={buyer.id} buyer={buyer} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Card>
  )
}

const getBaseProps = createBasePropFetcher()

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx
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

    const [baseProps, tickets, event, buyers] = await Promise.all([
      getBaseProps(ctx),
      ticketsReq.json(),
      eventReq.json(),
      buyersReq.json(),
    ])

    return {
      props: {
        home: false,
        baseProps,
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
