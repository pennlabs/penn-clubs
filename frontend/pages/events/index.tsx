import { DateTime } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import { Metadata, Title } from '~/components/common'
import EventCard from '~/components/EventPage/EventCard'
import { Club } from '~/types'
import { doApiRequest } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

import {
  classify,
  fetchEventsInRange,
  getDefaultDateRange,
} from '../../utils/events'

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }
  const dateRange = getDefaultDateRange()
  const [baseProps, clubs, events] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest('/clubs/directory/?format=json', data).then(
      (resp) => resp.json() as Promise<Club[]>,
    ),
    fetchEventsInRange(dateRange.start, dateRange.end, doApiRequest, data),
  ])
  const clubMap = new Map(clubs.map((club) => [club.code, club]))
  const eventsWithClubs = events.map((event) => ({
    ...event,
    club: event.club ? (clubMap.get(event.club) ?? null) : null,
    clubPublic: event.club == null || clubMap.get(event.club) !== undefined,
  }))
  return {
    props: {
      baseProps,
      events: eventsWithClubs,
    },
  }
}) satisfies GetServerSideProps

type EventsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const MainWrapper = styled.main`
  margin: 0 auto;
  width: 100vw;
  max-width: 1400px;
  padding: 20px;
`
const EventsListWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  place-content: center;
`
const ListSeparator = styled.hr`
  width: 100%;
  margin: 20px 0;
`

const EventsPage: React.FC<EventsPageProps> = ({ baseProps, events }) => {
  const { pastEvents, liveEvents, upcomingEvents } = useMemo(() => {
    const map = classify(events, (event) => {
      const now = DateTime.local()
      const startDate = DateTime.fromISO(event.earliest_start_time!)
      const endDate = DateTime.fromISO(event.latest_end_time!)
      if (endDate < now) return 'past'
      if (startDate <= now && now <= endDate) return 'live'
      return 'upcoming'
    })
    return {
      pastEvents: map.get('past') || [],
      liveEvents: map.get('live') || [],
      upcomingEvents: map.get('upcoming') || [],
    }
  }, [events])
  return (
    <BaseLayout {...baseProps}>
      <MainWrapper>
        <Metadata title="Events" />
        <Title>Live Events</Title>
        <EventsListWrapper>
          {liveEvents.length === 0 && <p>No live events right now.</p>}
          {liveEvents.map((event) => (
            <div key={event.id}>
              <Link href={`/events/${event.id}`}>
                <EventCard
                  event={{
                    ...event,
                    club: event.club?.code ?? null,
                  }}
                  start_time={event.earliest_start_time ?? ''}
                  end_time={event.latest_end_time ?? ''}
                />
              </Link>
            </div>
          ))}
        </EventsListWrapper>
        <ListSeparator />
        <Title>Upcoming Events</Title>
        <EventsListWrapper>
          {upcomingEvents.map((event) => (
            <div key={event.id}>
              <Link href={`/events/${event.id}`}>
                <EventCard
                  event={{
                    ...event,
                    club: event.club?.code ?? null,
                  }}
                  start_time={event.earliest_start_time ?? ''}
                  end_time={event.latest_end_time ?? ''}
                />
              </Link>
            </div>
          ))}
        </EventsListWrapper>
      </MainWrapper>
    </BaseLayout>
  )
}

export default EventsPage
