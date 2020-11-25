import equal from 'deep-equal'
import moment from 'moment'
import { NextPageContext } from 'next'
import Head from 'next/head'
import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import styled from 'styled-components'

import { EVENT_TYPES } from '../components/ClubEditPage/EventsCard'
import {
  Metadata,
  Modal,
  SegmentedButton,
  Title,
  WideWrapper,
} from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import EventCard from '../components/EventPage/EventCard'
import EventModal, { MEETING_REGEX } from '../components/EventPage/EventModal'
import { FuseTag } from '../components/FilterSearch'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from '../components/SearchBar'
import { CLUBS_GREY, EVENT_TYPE_COLORS, SNOW } from '../constants'
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

const localizer = momentLocalizer(moment)

const CalendarEvent = ({
  event: { resource },
}: {
  event: { resource: ClubEvent }
}) => {
  return (
    <>
      {resource.name} - {resource.club_name}
    </>
  )
}

enum EventsViewOption {
  LIST = 'LIST',
  CALENDAR = 'CALENDAR',
}

enum CalendarNavigation {
  PREVIOUS = 'PREV',
  NEXT = 'NEXT',
  TODAY = 'TODAY',
  DATE = 'DATE',
}

enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  WORK_WEEK = 'work_week',
  DAY = 'day',
  AGENDA = 'agenda',
}
interface CalendarHeaderProps {
  date: Date
  label: string
  onNavigate(action: CalendarNavigation, newDate?: Date): void
  onView(view: CalendarView): void
  view: string
  views: CalendarView[]
}

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  .tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    .view-label {
      font-size: 18px;
    }
    & > *:not(:first-child) {
      margin-left: 20px;
    }
  }
`

const ViewContext = createContext<
  [option: EventsViewOption, setOption?: (args?: any) => any]
>([EventsViewOption.CALENDAR])

const EventsViewSwitcher = ({ viewOption, setViewOption }) => (
  <SegmentedButton
    buttons={[
      {
        key: 'segmentbutton-list',
        icon: 'grid',
        selected: viewOption === EventsViewOption.LIST,
        onClick: () => {
          setViewOption(EventsViewOption.LIST)
        },
      },
      {
        key: 'segmentbutton-calendar',
        icon: 'calendar',
        selected: viewOption === EventsViewOption.CALENDAR,
        onClick: () => {
          setViewOption(EventsViewOption.CALENDAR)
        },
      },
    ]}
  />
)

const CalendarHeader = ({
  label,
  onNavigate,
  onView,
  view,
}: CalendarHeaderProps) => {
  const [viewOption, setViewOption] = useContext(ViewContext)
  const _views: CalendarView[] = [
    CalendarView.DAY,
    CalendarView.WEEK,
    CalendarView.MONTH,
  ]
  return (
    <StyledHeader>
      <Title className="title" style={{ color: CLUBS_GREY, margin: 0 }}>
        Events
      </Title>
      <div className="tools">
        <div className="view-label">{label}</div>
        <SegmentedButton
          buttons={[
            {
              key: 'prev',
              label: '<',
              onClick: () => {
                onNavigate(CalendarNavigation.PREVIOUS)
              },
            },
            {
              key: 'next',
              label: '>',
              onClick: () => {
                onNavigate(CalendarNavigation.NEXT)
              },
            },
          ]}
        />
        <SegmentedButton
          buttons={_views.map((key) => ({
            key,
            label: key[0].toUpperCase() + key.slice(1),
            selected: key === view,
            onClick: () => {
              onView(key)
            },
          }))}
        />
        <EventsViewSwitcher
          viewOption={viewOption}
          setViewOption={setViewOption}
        />
      </div>
    </StyledHeader>
  )
}

enum CalendarNavigation {
  PREVIOUS = 'PREV',
  NEXT = 'NEXT',
  TODAY = 'TODAY',
  DATE = 'DATE',
}

enum CalendarView {
  MONTH = 'month',
  WEEK = 'week',
  WORK_WEEK = 'work_week',
  DAY = 'day',
  AGENDA = 'agenda',
}
interface CalendarHeaderProps {
  date: Date
  label: string
  onNavigate(action: CalendarNavigation, newDate?: Date): void
  onView(view: CalendarView): void
  view: string
  views: CalendarView[]
}

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  .tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    .view-label {
      font-size: 18px;
    }
    & > *:not(:first-child) {
      margin-left: 20px;
    }
  }
`

const CalendarHeader = ({
  // date,
  label,
  onNavigate,
  onView,
  view,
}: CalendarHeaderProps) => {
  const _views: CalendarView[] = [
    CalendarView.DAY,
    CalendarView.WEEK,
    CalendarView.MONTH,
  ]
  return (
    <StyledHeader>
      <Title className="title" style={{ color: CLUBS_GREY, margin: 0 }}>
        Events
      </Title>
      <div className="tools">
        <div className="view-label">{label}</div>
        <SegmentedButton
          buttons={[
            {
              key: 'prev',
              label: '<',
              onClick: () => {
                onNavigate(CalendarNavigation.PREVIOUS)
              },
            },
            {
              key: 'next',
              label: '>',
              onClick: () => {
                onNavigate(CalendarNavigation.NEXT)
              },
            },
          ]}
        />
        <SegmentedButton
          buttons={_views.map((key) => ({
            key,
            label: key[0].toUpperCase() + key.slice(1),
            selected: key === view,
            onClick: () => {
              onView(key)
            },
          }))}
        />
      </div>
    </StyledHeader>
  )
}

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

  const [viewOption, setViewOption] = useState<EventsViewOption>(
    EventsViewOption.CALENDAR,
  )

  const [previewEvent, setPreviewEvent] = useState<ClubEvent | null>(null)
  const hideModal = () => setPreviewEvent(null)

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
      <Head>
        <link
          href="/static/css/react-big-calendar.css"
          rel="stylesheet"
          key="big-calendar-css"
        />
      </Head>
      <Metadata title="Events" />
      <style jsx global>
        {`
          .rbc-month-view,
          .rbc-time-view {
            background: white;
          }
          .rbc-time-view {
            height: 200vh;
          }
          .rbc-event {
            border: solid white 1px !important;
          }
          .rbc-event-content {
            font-size: 14px;
          }
        `}
      </style>
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
            options={EVENT_TYPES.map((obj) => ({ ...obj, name: 'type' }))}
          />
          {isClubFieldShown('application_required') && (
            <SearchBarCheckboxItem
              param="club__application_required__in"
              label="General Membership Process"
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
          <WideWrapper
            fullHeight
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: SNOW,
            }}
          >
            {isLoading && <ListLoadIndicator />}
            <ViewContext.Provider value={[viewOption, setViewOption]}>
              {viewOption === EventsViewOption.LIST ? (
                <>
                  {!!liveEvents.length && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Title
                          className="title"
                          style={{ color: CLUBS_GREY, marginTop: '30px' }}
                        >
                          Live Events
                        </Title>
                        <EventsViewSwitcher
                          viewOption={viewOption}
                          setViewOption={setViewOption}
                        />
                      </div>
                      <CardList>
                        {liveEvents.map((e) => (
                          <EventCard key={e.id} event={e} />
                        ))}
                      </CardList>
                      <br />
                    </>
                  )}
                  <Title className="title" style={{ color: CLUBS_GREY }}>
                    Upcoming Events
                  </Title>
                  <CardList>
                    {upcomingEvents.map((e) => (
                      <EventCard key={e.id} event={e} />
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
                        There are no upcoming events that match your search
                        query. If you are a member of a {OBJECT_NAME_SINGULAR},
                        you can add new events on the manage{' '}
                        {OBJECT_NAME_SINGULAR} page.
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Calendar
                    localizer={localizer}
                    components={{
                      event: CalendarEvent,
                      toolbar: CalendarHeader,
                    }}
                    onSelectEvent={(event: { resource: ClubEvent }) => {
                      setPreviewEvent(event.resource)
                    }}
                    events={[...liveEvents, ...upcomingEvents].map((e) => ({
                      title: e.name,
                      start: new Date(e.start_time),
                      end: new Date(e.end_time),
                      allDay: false,
                      resource: e,
                    }))}
                    eventPropGetter={({
                      resource,
                    }: {
                      resource: ClubEvent
                    }) => {
                      const color =
                        EVENT_TYPE_COLORS[resource.type] || CLUBS_GREY
                      return {
                        style: {
                          backgroundColor: color,
                          color: '#6F6F6F',
                          border: 'none',
                        },
                      }
                    }}
                    style={{ flex: '1' }}
                  />
                </>
              )}
            </ViewContext.Provider>
          </WideWrapper>
        </SearchbarRightContainer>
      </div>
      {previewEvent && (
        <Modal show={true} closeModal={hideModal} width="45%">
          <EventModal event={previewEvent} showDetailsButton={true} />
        </Modal>
      )}
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
