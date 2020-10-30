import equal from 'deep-equal'
import { NextPageContext } from 'next'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

import { Metadata, Title, WideContainer } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import EventCard from '../components/EventPage/EventCard'
import { MEETING_REGEX } from '../components/EventPage/EventModal'
import { FuseTag } from '../components/FilterSearch'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from '../components/SearchBar'
import { CLUBS_GREY, SNOW } from '../constants'
import renderPage from '../renderPage'
import { Badge, ClubEvent, Tag } from '../types'
import { doApiRequest, isClubFieldShown } from '../utils'
import { OBJECT_NAME_SINGULAR } from '../utils/branding'
import { ListLoadIndicator } from '.'

interface EventPageProps {
  authenticated: boolean | null
  liveEvents: ClubEvent[]
  upcomingEvents: ClubEvent[]
  tags: Tag[]
  badges: Badge[]
}

const CardList = styled.div`
  & .event {
    display: inline-block;
    vertical-align: top;
    width: 400px;
  }
`

/**
 * Randomize the order the events are shown in.
 * First prioritize the events with an earlier start date.
 * If these are equal, slightly prioritize events with more filled out info.
 */
const randomizeEvents = (events: ClubEvent[]): ClubEvent[] => {
  const withRankings = events.map((event) => {
    let rank = Math.random()
    if (event.image_url) {
      rank += 2
    }
    if (
      event.description &&
      event.description.length > 3 &&
      event.description !== 'Replace this description!'
    ) {
      rank += 2
    }
    if (event.url) {
      rank += 3
      if (MEETING_REGEX.test(event.url)) {
        rank += 0.5
      }
    }
    return {
      event,
      rank,
      startDate: new Date(event.start_time),
      endDate: new Date(event.end_time),
    }
  })
  return withRankings
    .sort((a, b) => {
      if (a.startDate < b.startDate) {
        return -1
      }
      if (b.startDate < a.startDate) {
        return 1
      }
      return b.rank - a.rank
    })
    .map((a) => a.event)
}

function EventPage({
  authenticated,
  upcomingEvents: initialUpcomingEvents,
  liveEvents: initialLiveEvents,
  tags,
  badges,
}: EventPageProps): ReactElement {
  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>(() =>
    randomizeEvents(initialUpcomingEvents),
  )
  const [liveEvents, setLiveEvents] = useState<ClubEvent[]>(() =>
    randomizeEvents(initialLiveEvents),
  )

  const [searchInput, setSearchInput] = useState<SearchInput>({})
  const currentSearch = useRef<SearchInput>({})
  const [isLoading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (equal(searchInput, currentSearch.current)) {
      return
    }

    currentSearch.current = searchInput

    let isCurrent = true

    const params = new URLSearchParams()
    params.set('format', 'json')

    Object.entries(searchInput).forEach(([key, value]) =>
      params.set(key, value),
    )

    setLoading(true)

    Promise.all([
      doApiRequest(`/events/live/?${params.toString()}`)
        .then((resp) => resp.json())
        .then((resp) => {
          if (isCurrent) {
            setLiveEvents(randomizeEvents(resp))
          }
        }),
      doApiRequest(`/events/upcoming/?${params.toString()}`)
        .then((resp) => resp.json())
        .then((resp) => {
          if (isCurrent) {
            setUpcomingEvents(randomizeEvents(resp))
          }
        }),
    ]).then(() => setLoading(false))

    return () => {
      isCurrent = false
    }
  }, [searchInput])

  if (!authenticated) {
    return <AuthPrompt />
  }

  const tagOptions = useMemo<FuseTag[]>(
    () =>
      tags.map(({ id, name, clubs }) => ({
        value: id,
        label: name,
        count: clubs,
      })),
    [tags],
  )

  const badgeOptions = useMemo<FuseTag[]>(
    () =>
      badges.map(({ id, label, color, description }) => ({
        value: id,
        label,
        color,
        description,
      })),
    [badges],
  )

  return (
    <>
      <Metadata title="Events" />
      <div style={{ backgroundColor: SNOW }}>
        <SearchBar updateSearch={setSearchInput} searchInput={searchInput}>
          <SearchBarTextItem param="search" />
          <SearchBarTagItem
            param="club__tags__in"
            label="Tags"
            options={tagOptions}
          />
          <SearchBarTagItem
            param="club__badges__in"
            label="Badges"
            options={badgeOptions}
          />
          <SearchBarCheckboxItem
            param="type__in"
            label="Event Type"
            options={[
              { value: 2, label: 'General Body Meeting (GBM)', name: 'type' },
              { value: 1, label: 'Recruitment', name: 'type' },
              { value: 3, label: 'Speaker', name: 'type' },
              { value: 4, label: 'Activities Fair', name: 'type' },
              { value: 0, label: 'Other', name: 'type' },
            ]}
          />
          {isClubFieldShown('application_required') && (
            <SearchBarCheckboxItem
              param="club__application_required__in"
              label="Application Required"
              options={[
                { value: 1, label: 'Open Membership', name: 'app' },
                {
                  value: 2,
                  label: 'Tryout Required',
                  name: 'app',
                },
                {
                  value: 3,
                  label: 'Audition Required',
                  name: 'app',
                },
                {
                  value: 4,
                  label: 'Application Required',
                  name: 'app',
                },
                {
                  value: 5,
                  label: 'Application and Interview Required',
                  name: 'app',
                },
              ]}
            />
          )}
          {isClubFieldShown('size') && (
            <SearchBarCheckboxItem
              param="club__size__in"
              label="Size"
              options={[
                { value: 1, label: 'less than 20 members', name: 'size' },
                { value: 2, label: '20 to 50 members', name: 'size' },
                { value: 3, label: '50 to 100 members', name: 'size' },
                { value: 4, label: 'more than 100', name: 'size' },
              ]}
            />
          )}
          {isClubFieldShown('accepting_members') && (
            <SearchBarCheckboxItem
              param="club__accepting_members"
              label="Accepting Members"
              options={[
                {
                  value: 'true',
                  label: 'Is Accepting Members',
                  name: 'accept',
                },
              ]}
            />
          )}
        </SearchBar>
        <SearchbarRightContainer>
          <WideContainer background={SNOW} fullHeight>
            {!!liveEvents.length && (
              <>
                <Title
                  className="title"
                  style={{ color: CLUBS_GREY, marginTop: '30px' }}
                >
                  Live Events
                </Title>
                {isLoading && <ListLoadIndicator />}
                <CardList>
                  {liveEvents.map((e) => (
                    <EventCard key={e.id} event={e} isHappening={true} />
                  ))}
                </CardList>
                <br />
              </>
            )}
            <Title className="title" style={{ color: CLUBS_GREY }}>
              Upcoming Events
            </Title>
            {isLoading && <ListLoadIndicator />}
            <CardList>
              {upcomingEvents.map((e) => (
                <EventCard key={e.id} event={e} isHappening={false} />
              ))}
            </CardList>
            {!upcomingEvents.length && (
              <div className="notification is-info is-clearfix">
                <img
                  className="is-pulled-left mr-5 mb-3"
                  style={{ width: 100 }}
                  src="/static/img/events_calendar.png"
                />
                <div>
                  There are no upcoming events that match your search query. If
                  you are a member of a {OBJECT_NAME_SINGULAR}, you can add new
                  events on the manage {OBJECT_NAME_SINGULAR} page.
                </div>
              </div>
            )}
          </WideContainer>
        </SearchbarRightContainer>
      </div>
    </>
  )
}

EventPage.getInitialProps = async (ctx: NextPageContext) => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const [liveEvents, upcomingEvents, tags, badges] = await Promise.all([
    doApiRequest('/events/live/?format=json', data).then((resp) => resp.json()),
    doApiRequest('/events/upcoming/?format=json', data).then((resp) =>
      resp.json(),
    ),
    doApiRequest('/tags/?format=json', data).then((resp) => resp.json()),
    doApiRequest('/badges/?format=json', data).then((resp) => resp.json()),
  ])

  return { liveEvents, upcomingEvents, tags, badges }
}

export default renderPage(EventPage)
