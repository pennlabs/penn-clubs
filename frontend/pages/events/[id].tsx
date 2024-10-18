import { DateTime, Settings } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useState } from 'react'
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
import { BetaTag } from '~/components/common/BetaTag'
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
import { doApiRequest, EMPTY_DESCRIPTION } from '~/utils'
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
  flex: 0 0 auto;
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
  available: string
  count: number | null
}

type TicketItemProps = {
  ticket: Ticket
  name: string
  price: string
  max: string
  onCountChange: (newCount: number) => void
}

const GetTicketItem: React.FC<TicketItemProps> = ({
  ticket,
  name,
  price,
  max,
  onCountChange,
}) => {
  const [count, setCount] = useState(ticket.count)
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Round to nearest integer and clamp to min/max
    const value = Math.max(
      0,
      Math.min(Math.round(parseFloat(e.target.value)), parseInt(max, 10)),
    )
    setCount(value)
    onCountChange(value)
  }

  return (
    <div
      style={{
        padding: '5px 0px',
        borderBottom: '1px solid #e0e0e0',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px 16px',
        }}
      >
        <p style={{ fontSize: '18px' }}>
          {name} - ${price}
        </p>
        <Input
          type="number"
          pattern="[0-9]*"
          className="input"
          min={0}
          max={max}
          value={count ?? 1}
          step={1}
          placeholder="Ticket Count"
          onChange={handleCountChange}
          style={{ flex: '0 0 auto', maxWidth: '64px' }}
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
      available: counts.available.toString(),
      count: 0,
    })),
  )

  const totalAvailableTickets = Object.values(ticketMap)
    .map((k) => k.available)
    .reduce((a, b) => a + b, 0)

  const image = event.image_url ?? club.image_url

  return (
    <>
      <Modal
        show={showTicketModal}
        closeModal={() => setShowTicketModal(false)}
        marginBottom={false}
      >
        <BetaTag>
          <Subtitle style={{ marginLeft: '12px', marginBottom: '20px' }}>
            Get Tickets
          </Subtitle>
        </BetaTag>
        {order.map((ticket, index) => (
          <GetTicketItem
            ticket={ticket}
            max={ticket.available}
            name={ticket.type}
            price={ticket.price}
            onCountChange={(count: number | null) => {
              const ticks = [...order]
              ticks[index].count = count
              setOrder(ticks)
            }}
          />
        ))}
        <button
          className="button is-primary my-4"
          disabled={order.every((ticket) => ticket.count === 0)}
          onClick={() => {
            // Select type and count properties
            const orderToSend = order
              .filter((ticket) => ticket.count != null && ticket.count !== 0)
              .map(({ type, count }) => ({ type, count }))
            doApiRequest(
              `/clubs/${event.club}/events/${event.id}/add_to_cart/`,
              {
                method: 'POST',
                body: {
                  quantities: orderToSend,
                },
              },
            )
              .then((resp) => resp.json())
              .then((res) => {
                if (res.success) {
                  toast.success('Tickets added to cart')
                  setShowTicketModal(false)
                } else {
                  toast.error(res.detail, {
                    style: { color: WHITE },
                  })
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
                <div
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html: event.description || EMPTY_DESCRIPTION,
                  }}
                />
                <Divider />
                <div
                  className="content"
                  dangerouslySetInnerHTML={{
                    __html: club.description || EMPTY_DESCRIPTION,
                  }}
                />
              </Card>
            </div>
            <Right>
              <img width={450} src={image} alt={`${event.name} Event Image`} />
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
                    disabled={
                      totalAvailableTickets === 0 || endTime < DateTime.now()
                    }
                    onClick={() => setShowTicketModal(true)}
                  >
                    {endTime < DateTime.now() ? 'Event Ended' : 'Get Tickets'}
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
