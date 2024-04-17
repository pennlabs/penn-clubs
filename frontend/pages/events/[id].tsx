import { DateTime, Settings } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { ReactElement, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import {
  Metadata,
  Modal,
  StrongText,
  Subtitle,
  Text,
  Title,
} from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BODY_FONT,
  BORDER,
  BORDER_RADIUS,
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_LIGHT_BLUE,
  FOCUS_GRAY,
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
  WHITE,
} from '~/constants'
import { Club, ClubEvent, TicketAvailability } from '~/types'
import { doApiRequest } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

Settings.defaultZone = 'America/New_York'

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const id = ctx.params?.id
  if (typeof id !== 'string') {
    return {
      notFound: true,
    }
  }
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }
  // TODO: Add caching
  const [baseProps, event] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest(`/events/${id}`, data).then(
      (resp) => resp.json() as Promise<ClubEvent>,
    ),
  ])
  const [club, tickets] = await Promise.all([
    doApiRequest(`/clubs/${event.club}/`, data).then(
      (resp) => resp.json() as Promise<Club>,
    ),
    doApiRequest(`/clubs/${event.club}/events/${id}/tickets/`, data).then(
      (resp) => resp.json() as Promise<TicketAvailability>,
    ),
  ])
  return {
    props: {
      baseProps,
      club,
      tickets,
      event,
    },
  }
}) satisfies GetServerSideProps

type EventPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const MainWrapper = styled.main`
  margin: 0 auto;
  width: 100vw;
  max-width: 1400px;
  padding: 20px;
`

const GridWrapper = styled.div`
  display: grid;
  ${mediaMinWidth(PHONE)} {
    grid-template-columns: 2fr 1fr;
  }
  ${mediaMaxWidth(PHONE)} {
    grid-template-columns: 1fr;
  }
  gap: 24px;
`

const Tag = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  background-color: ${CLUBS_LIGHT_BLUE};
  color: ${CLUBS_BLUE};
  font-size: 0.8rem;
  font-weight: 600;
`

const Right = styled.div`
  img {
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 0 12px #00000033;
  }
`

const Card = styled.div`
  margin-top: 20px;
  border-radius: 8px;
  border: 1px solid ${BORDER};
  background-color: #fff;
  padding: 20px;
  p {
    margin: 0.2rem;
  }
`

const Divider = styled.hr`
  width: 100%;
  margin: 20px 0;
`

const Input = styled.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  flex: '0 0 auto';
  font-size: 1em;
  padding: 8px 10px;
  margin: 0px 5px 0px 0px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  min-width: 50px;
  font-family: ${BODY_FONT};
  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

type Ticket = {
  type: string
  price: string
  max: string
  count: string | null
}

const TicketItem = ({
  ticket,
  name,
  price,
  max,
  changeCount,
  index,
}): ReactElement => {
  const [count, setCount] = useState(ticket.count)
  const handleCountChange = (e: { target: { value: string } }) => {
    // Round to nearest integer and clamp to min/max
    const value = Math.max(
      0,
      Math.min(Math.round(parseFloat(e.target.value)), parseInt(max, 10)),
    )
    setCount(value)
    changeCount(value, index)
  }

  return (
    <div style={{ padding: '5px 0px' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <p style={{ flex: '1', fontSize: '18px' }}>
          {name} - ${price}
        </p>
        <Input
          type="number"
          className="input"
          min={0}
          max={max}
          value={count}
          step={1}
          placeholder="Ticket Count"
          onChange={handleCountChange}
          style={{ flex: '0 0 auto', width: 'initial!important' }}
        />
      </div>
    </div>
  )
}

const EventPage: React.FC<EventPageProps> = ({
  baseProps,
  club,
  event,
  tickets,
}) => {
  const [showTicketModal, setShowTicketModal] = useState(false)

  const startTime = DateTime.fromISO(event.start_time)
  const endTime = DateTime.fromISO(event.end_time)

  const ticketMap = tickets.totals.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.type]: {
        total: cur.count,
        available:
          tickets.available.find((t) => t.type === cur.type)?.count ?? 0,
        price: cur.price,
      },
    }),
    {},
  ) as Record<string, { total: number; available: number; price: number }>

  const [order, setOrder] = useState<Ticket[]>(
    Object.entries(ticketMap).map(([type, counts]) => ({
      type,
      price: counts.price.toString(),
      max: counts.total.toString(),
      count: '0',
    })),
  )

  const totalAvailableTickets = Object.values(ticketMap)
    .map((k) => k.available)
    .reduce((a, b) => a + b, 0)

  const handleCountChange = (count: string | null, i: string | number) => {
    const ticks = [...order]
    ticks[i].count = count
    setOrder(ticks)
  }

  return (
    <>
      <Modal
        show={showTicketModal}
        closeModal={() => setShowTicketModal(false)}
        marginBottom={false}
      >
        <Subtitle>Get Tickets</Subtitle>
        {order.map((ticket, index) => (
          <TicketItem
            ticket={ticket}
            index={index}
            max={ticket.max}
            name={ticket.type}
            price={ticket.price}
            changeCount={handleCountChange}
          />
        ))}
        <button
          className="button is-primary my-4"
          onClick={() => {
            // Select type and count properties
            const orderToSend = order
              .filter((ticket) => ticket.count != null && ticket.count !== '0')
              .map(({ type, count }) => ({ type, count }))
            doApiRequest(
              `/clubs/${event.club}/events/${event.id}/add_to_cart/?format=json`,
              {
                method: 'POST',
                body: {
                  quantities: orderToSend,
                },
              },
            ).then((res) => {
              if (res.ok) {
                toast.success('Tickets purchased successfully')
                setShowTicketModal(false)
              }
            })
          }}
        >
          Purchase Tickets
        </button>
      </Modal>
      <BaseLayout {...baseProps}>
        <Metadata title="Events" />
        <MainWrapper>
          <GridWrapper>
            <div>
              <Title>{event.name}</Title>
              <Subtitle>
                Hosted by <Link href={`/club/${club.code}`}>{club.name}</Link>
              </Subtitle>
              <div>
                {event.badges.map((badge) => (
                  <Tag key={badge.id}>{badge.label}</Tag>
                ))}
              </div>
              <Card>
                <p>{event.description}</p>
                <Divider />
                <p>{club.description}</p>
              </Card>
            </div>
            <Right>
              <img
                // TODO: Replace with actual image
                src={'https://placehold.co/450x280/black/white'}
                alt={event.name}
              />
              {event.ticketed && (
                <Card>
                  <StrongText>Tickets</StrongText>
                  <Text>
                    {totalAvailableTickets > 0
                      ? `${totalAvailableTickets} tickets available`
                      : 'Sold out'}
                  </Text>
                  {Object.entries(ticketMap).map(([type, counts]) => (
                    <Text key={type}>
                      {type}: {counts.available} tickets available /{' '}
                      {counts.total} total
                    </Text>
                  ))}
                  <button
                    className="button is-primary is-fullwidth mt-4"
                    disabled={totalAvailableTickets === 0}
                    onClick={() => setShowTicketModal(true)}
                  >
                    Get Tickets
                  </button>
                </Card>
              )}
              <Card>
                <StrongText>Date</StrongText>
                <Text>
                  {startTime.hasSame(endTime, 'day')
                    ? startTime.toFormat('cccc, LLLL d, yyyy')
                    : startTime.toFormat('cccc, LLLL d, yyyy t') +
                      ' - ' +
                      endTime.toFormat('cccc, LLLL d, yyyy t')}
                </Text>
                {startTime.hasSame(endTime, 'day') && (
                  <>
                    <StrongText>Time</StrongText>
                    <Text>
                      {startTime.toFormat('t')} - {endTime.toFormat('t')}
                    </Text>
                  </>
                )}
                {event.location && (
                  <>
                    <StrongText>Location</StrongText>
                    <Text>{event.location}</Text>
                  </>
                )}
              </Card>
            </Right>
          </GridWrapper>
        </MainWrapper>
      </BaseLayout>
    </>
  )
}

export default EventPage
