import { DateTime, Settings } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useState } from 'react'
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
  BORDER,
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
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
      },
    }),
    {},
  ) as Record<string, { total: number; available: number }>

  const totalAvailableTickets = Object.values(ticketMap)
    .map((k) => k.available)
    .reduce((a, b) => a + b, 0)

  return (
    <>
      <Modal
        show={showTicketModal}
        closeModal={() => setShowTicketModal(false)}
      >
        <h1>Get Tickets</h1>
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
