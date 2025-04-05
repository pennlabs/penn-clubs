import { DateTime } from 'luxon'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import React, { useMemo } from 'react'
import styled from 'styled-components'

import { BaseLayout } from '~/components/BaseLayout'
import { Metadata, Title } from '~/components/common'
import EventCard from '~/components/EventPage/EventCard'
import { EventGroup, EventInstanceWithGroup } from '~/types'
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
    // Use the event time filters supported by the backend EventGroupViewSet
    // eslint-disable-next-line camelcase
    event_start_time__gte: dateRange.start.toISO()!,
    // eslint-disable-next-line camelcase
    event_end_time__lte: dateRange.end.toISO()!,
    format: 'json',
  })

  // Fetch EventGroups instead of individual events
  const [baseProps, eventGroups] = await Promise.all([
    getBaseProps(ctx),
    doApiRequest(`/eventgroups/?${params.toString()}`, data).then(
      (resp) => resp.json() as Promise<EventGroup[]>, // Expecting an array of EventGroup
    ),
  ])

  // Flatten events into EventInstanceWithGroup structure
  const eventInstances: EventInstanceWithGroup[] = []
  eventGroups.forEach((group) => {
    if (group.events.length > 0) {
      group.events.forEach((event) => {
        eventInstances.push({
          event: { ...event },
          group,
        })
      })
    }
  })

  // Sort events by start time after flattening
  eventInstances.sort(
    (a, b) =>
      DateTime.fromISO(a.event.start_time).toMillis() -
      DateTime.fromISO(b.event.start_time).toMillis(),
  )

  return {
    props: {
      baseProps,
      // Pass the flattened list of event instances with their groups
      events: eventInstances,
    },
  }
}) satisfies GetServerSideProps<{
  baseProps: any
  events: EventInstanceWithGroup[]
}> // Update prop type

// Ensure the component receives the correct props type
type EventsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const classify = <T extends EventInstanceWithGroup, K>(
  arr: T[],
  predicate: (item: T) => K,
): Map<K, T[]> => {
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
    const map = classify(events, (item) => {
      const now = DateTime.local()
      const startDate = DateTime.fromISO(item.event.start_time)
      const endDate = DateTime.fromISO(item.event.end_time)
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
          {liveEvents.map((item) => (
            <div key={item.event.id}>
              <Link href={`/events/${item.group.code}`}>
                <EventCard event={item} />
              </Link>
            </div>
          ))}
        </EventsListWrapper>
        <ListSeparator />
        <Title>Upcoming Events</Title>
        <EventsListWrapper>
          {upcomingEvents.map((item) => (
            <div key={item.event.id}>
              <Link href={`/events/${item.group.code}`}>
                <EventCard event={item} key={item.event.id} />
              </Link>
            </div>
          ))}
        </EventsListWrapper>
      </MainWrapper>
    </BaseLayout>
  )
}

export default EventsPage
