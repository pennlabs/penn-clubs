import { DateTime } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import { Metadata, Title } from '~/components/common'
import EventCard from '~/components/EventPage/EventCard'
import { Club, ClubEvent } from '~/types'
import { doApiRequest } from '~/utils'
import { createBasePropFetcher } from '~/utils/getBaseProps'

/**
 * Return the default date range for events in the calendar view.
 * Returns the events for a month with a little bit of padding on both edges (6 days).
 */
const getDefaultDateRange = () => ({
  start: DateTime.local().startOf('day').minus({ days: 6 }),
  end: DateTime.local().startOf('day').plus({ month: 1, days: 6 }),
})

const getBaseProps = createBasePropFetcher()

export const getServerSideProps = (async (ctx) => {
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }
  const dateRange = getDefaultDateRange()
  const params = new URLSearchParams({
    // eslint-disable-next-line camelcase
    start_time__gte: dateRange.start.toISO(),
    // eslint-disable-next-line camelcase
    end_time__lte: dateRange.end.toISO(),
    format: 'json',
  })
  // TODO: Add caching
  const [baseProps, clubs, events] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest('/clubs/directory/?format=json', data).then(
      (resp) => resp.json() as Promise<Club[]>,
    ),
    doApiRequest(`/events/?${params.toString()}`, data).then(
      (resp) => resp.json() as Promise<ClubEvent[]>,
    ),
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

const classify = <T, K>(arr: T[], predicate: (item: T) => K): Map<K, T[]> => {
  const map = new Map<K, T[]>()
  for (const item of arr) {
    const key = predicate(item)
    const list = map.get(key) || []
    list.push(item)
    map.set(key, list)
  }
  return map
}

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
      const startDate = DateTime.fromISO(event.start_time)
      const endDate = DateTime.fromISO(event.end_time)
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
    <BaseLayout {...baseProps} authRequired>
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
                  key={event.id}
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
