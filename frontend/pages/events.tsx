import Color from 'color'
import { EVENT_TYPES } from 'components/ClubEditPage/EventsCard'
import {
  Icon,
  Metadata,
  Modal,
  Subtitle,
  Title,
  WideContainer,
} from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import EventCard from 'components/EventPage/EventCard'
import EventModal, { MEETING_REGEX } from 'components/EventPage/EventModal'
import SyncModal from 'components/EventPage/SyncModal'
import { FuseTag } from 'components/FilterSearch'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from 'components/SearchBar'
import equal from 'deep-equal'
import moment from 'moment'
import { NextPageContext } from 'next'
import Head from 'next/head'
import {
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import renderPage from 'renderPage'
import styled from 'styled-components'
import {
  Badge,
  ClubEvent,
  ClubEventType,
  ClubFair,
  Tag,
  VisitType,
} from 'types'
import { cache, doApiRequest, isClubFieldShown } from 'utils'
import { OBJECT_NAME_SINGULAR, OBJECT_NAME_TITLE } from 'utils/branding'

import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  EVENT_TYPE_COLORS,
  FULL_NAV_HEIGHT,
  MD,
  mediaMaxWidth,
  SNOW,
  WHITE,
} from '~/constants'

type CalendarDateRange = Date[] | { start: Date; end: Date }

interface EventPageProps {
  authenticated: boolean | null
  events: ClubEvent[]
  dateRange: CalendarDateRange
  tags: Tag[]
  badges: Badge[]
  clubs: { name: string; code: string }[]
  fair: ClubFair | null
}

const CardList = styled.div`
  margin-left: -1rem;
  margin-right: -1rem;

  & .event {
    display: inline-block;
    vertical-align: top;
    width: 400px;
  }

  ${mediaMaxWidth(MD)} {
    & .event {
      width: 100%;
    }
  }
`

const localizer = momentLocalizer(moment)

/**
 * Render how the event is shown on the calendar view.
 */
const CalendarEvent = ({
  event: { resource },
}: {
  event: { resource: ClubEvent }
}) => {
  return (
    <>
      {resource.club_name == null && <Icon name="globe" className="mr-1" />}
      {resource.name}
      {resource.club_name != null && <> - {resource.club_name}</>}
    </>
  )
}

/**
 * Log the event when a user clicks on an event and opens up the modal.
 */
const logEvent = (visit: VisitType, club: string | null): void => {
  if (club == null) {
    return
  }
  doApiRequest('/clubvisits/?format=json', {
    method: 'POST',
    body: {
      club,
      visit_type: visit,
    },
  })
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

const StyledHeader = styled.div.attrs({ className: 'is-clearfix' })`
  margin: 20px 0;
  & > .info {
    float: left;
  }
  .tools {
    float: right;
    margin: 0;
    margin-left: auto;
    & > div {
      margin-left: 20px;
      display: inline-block;
    }
  }

  ${mediaMaxWidth(MD)} {
    .tools {
      margin-top: 20px;
    }
  }
`

const ViewContext = createContext<
  [
    option: EventsViewOption,
    setOption?: Dispatch<SetStateAction<EventsViewOption>>,
    showSyncModal?: () => void,
  ]
>([EventsViewOption.CALENDAR])

/**
 * Component used to display a method to switch between the event grid and calendar views.
 */
const EventsViewToolbar = ({
  viewOption,
  setViewOption,
  showSyncModal,
  viewsVisible,
  setViewsVisible,
}): ReactElement => (
  <>
    <div
      className="buttons has-addons mt-0 mb-0"
      style={{ width: 150 }}
      onMouseEnter={() => {
        setViewsVisible(true)
      }}
      onMouseLeave={() => {
        setViewsVisible(false)
      }}
    >
      {viewsVisible ? (
        <>
          <button
            id="event-view-list"
            className={`button is-medium ${
              viewOption === EventsViewOption.LIST ? 'is-selected is-info' : ''
            }`}
            aria-label="switch to grid view"
            onClick={() => {
              setViewOption(EventsViewOption.LIST)
            }}
            style={{ width: '50%' }}
          >
            <Icon name="grid" alt="grid view" />
          </button>
          <button
            id="event-view-calendar"
            className={`button is-medium ${
              viewOption === EventsViewOption.CALENDAR
                ? 'is-selected is-info'
                : ''
            }`}
            aria-label="switch to calendar view"
            onClick={() => {
              setViewOption(EventsViewOption.CALENDAR)
            }}
            style={{ width: '50%' }}
          >
            <Icon name="calendar" alt="calendar view" />
          </button>
        </>
      ) : (
        <button className="button is-medium" style={{ width: '100%' }}>
          Toggle View
        </button>
      )}
    </div>
    <div className="buttons has-addons mt-0 mb-0">
      <button
        onClick={() => {
          showSyncModal && showSyncModal()
        }}
        className="button is-medium"
      >
        <Icon name="refresh" className="mr-1" /> Export
      </button>
    </div>
  </>
)

/**
 * Renders the controls used to navigate through the calendar view.
 */
const CalendarHeader = ({
  label,
  onNavigate,
  onView,
  view,
}: CalendarHeaderProps) => {
  const [
    viewOption,
    setViewOption,
    showSyncModal,
    viewsVisible,
    setViewsVisible,
  ] = useContext(ViewContext)
  const _views: CalendarView[] = [
    CalendarView.DAY,
    CalendarView.WEEK,
    CalendarView.MONTH,
  ]
  return (
    <StyledHeader>
      <div className="info">
        <Title className="title" style={{ color: CLUBS_GREY, margin: 0 }}>
          Events
        </Title>
        <div>{label}</div>
      </div>
      <div className="tools">
        <div className="buttons has-addons mt-0 mb-0">
          <button
            className="button is-medium"
            aria-label="go to previous page"
            onClick={() => {
              onNavigate(CalendarNavigation.PREVIOUS)
            }}
          >
            <Icon name="chevrons-left" alt="previous" />
          </button>
          <button
            className="button is-medium"
            aria-label="go to today"
            onClick={() => {
              onNavigate(CalendarNavigation.TODAY)
            }}
          >
            Today
          </button>
          <button
            className="button is-medium"
            aria-label="go to next page"
            onClick={() => {
              onNavigate(CalendarNavigation.NEXT)
            }}
          >
            <Icon name="chevrons-right" alt="next" />
          </button>
        </div>
        <div className="buttons has-addons mt-0 mb-0">
          {_views.map((key) => (
            <button
              className={`button is-medium ${
                view === key ? 'is-selected is-info' : ''
              }`}
              onClick={() => {
                onView(key)
              }}
              key={key}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <EventsViewToolbar
          viewOption={viewOption}
          setViewOption={setViewOption}
          showSyncModal={showSyncModal}
          viewsVisible={viewsVisible}
          setViewsVisible={setViewsVisible}
        />
      </div>
    </StyledHeader>
  )
}

/**
 * Convert all of the possible formats of date ranges that Big Calendar provides into one consistent format.
 */
const parseDateRange = (
  range: CalendarDateRange,
): { start: string; end: string } => {
  if (Array.isArray(range)) {
    if (range.length === 1) {
      range = {
        start: range[0],
        end: new Date(range[0].getTime() + 60 * 60 * 24 * 1000),
      }
    } else {
      const max = new Date(
        Math.max(...((range as unknown) as number[])) + 24 * 60 * 60 * 1000,
      )
      const min = new Date(Math.min(...((range as unknown) as number[])))
      range = { start: min, end: max }
    }
  }
  return {
    start:
      typeof range.start === 'string' ? range.start : range.start.toISOString(),
    end: typeof range.end === 'string' ? range.end : range.end.toISOString(),
  }
}

/**
 * Return the default date range for events in the calendar view.
 * Returns the events for a month with a little bit of padding on both edges.
 */
const getDefaultDateRange = (): { start: Date; end: Date } => {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), -6),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 6),
  }
}

/**
 * Sort the order the events are shown in.
 * First prioritize the events with an earlier start date.
 * If these are equal, slightly prioritize events with more filled out info.
 */
const sortEvents = (events: ClubEvent[]): ClubEvent[] => {
  const withRankings = events.map((event) => {
    let rank = 0
    if (event.pinned) {
      rank += 10
    }
    if (event.image_url) {
      rank += 2
    }
    if (event.description && event.description.length > 3) {
      rank += 2
    }
    if (event.url && MEETING_REGEX.test(event.url)) {
      rank += 3
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
      if (a.rank !== b.rank) {
        return b.rank - a.rank
      }
      return (
        a.event.club_name?.localeCompare(b.event.club_name as string) ??
        a.event.name.localeCompare(b.event.name)
      )
    })
    .map((a) => a.event)
}

function EventPage({
  authenticated,
  events: initialEvents,
  dateRange: initialDateRange,
  tags,
  badges,
  clubs,
  fair,
}: EventPageProps): ReactElement {
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>(
    initialEvents,
  )

  const isFair = fair != null

  // during an activities fair, use list view and filter fair events by default
  const [searchInput, setSearchInput] = useState<SearchInput>(
    isFair
      ? {
          type__in: ClubEventType.FAIR.toString(),
          fair: fair?.id.toString() as string,
        }
      : {},
  )
  const [syncModalVisible, setSyncModalVisible] = useState<boolean>(false)

  const showSyncModal = () => setSyncModalVisible(true)
  const hideSyncModal = () => setSyncModalVisible(false)

  const [viewOption, setViewOption] = useState<EventsViewOption>(
    EventsViewOption.LIST,
  )

  const [dateRange, setDateRange] = useState<CalendarDateRange>(
    initialDateRange,
  )

  const currentSearch = useRef<
    [SearchInput, EventsViewOption, CalendarDateRange]
  >([{}, viewOption, dateRange])

  const [previewEvent, setPreviewEvent] = useState<ClubEvent | null>(null)
  const hideModal = () => setPreviewEvent(null)

  const [viewsVisible, setViewsVisible] = useState<boolean>(false)

  useEffect(() => {
    if (previewEvent != null) {
      logEvent(VisitType.EventModal, previewEvent.club)
    }
  }, [previewEvent])

  /**
   * When the search parameters or the view is changed, refetch the events from the server.
   */
  useEffect(() => {
    if (equal(searchInput, currentSearch.current)) {
      return
    }

    currentSearch.current = [searchInput, viewOption, dateRange]

    let isCurrent = true

    const params = new URLSearchParams()
    params.set('format', 'json')

    Object.entries(searchInput).forEach(([key, value]) =>
      params.set(key, value),
    )

    // fetch appropriate range for calendar, or now to three months from now for list
    const now = new Date()
    const { start, end } =
      viewOption === EventsViewOption.CALENDAR
        ? parseDateRange(dateRange)
        : {
            start: now.toISOString(),
            end: new Date(now.getFullYear(), now.getMonth() + 3).toISOString(),
          }
    params.set('end_time__gte', start)
    params.set('start_time__lte', end)
    doApiRequest(`/events/?${params.toString()}`)
      .then((resp) => resp.json())
      .then((data) => isCurrent && setCalendarEvents(data))

    return () => {
      isCurrent = false
    }
  }, [searchInput, viewOption, dateRange])

  if (!authenticated) {
    return <AuthPrompt />
  }

  const clubOptions = useMemo<FuseTag[]>(() => {
    return clubs.map(({ name, code }) => ({ value: code, label: name }))
  }, [clubs])

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

  /**
   * Given a date range from big calendar, fetch the events associated with that date range.
   */
  const fetchForDateRange = (range: CalendarDateRange): void => {
    setDateRange(range)
  }

  // split events into live events and upcoming events for the list view
  let liveEvents: ClubEvent[] = []
  let upcomingEvents: ClubEvent[] = []

  let minHour = 9
  let maxHour = 22

  const now = new Date()
  calendarEvents
    .filter((event) => {
      // remove global events from the list view (calendar view only)
      return event.club != null
    })
    .forEach((event) => {
      const endTime = new Date(event.end_time)
      const startTime = new Date(event.start_time)
      if (endTime >= now) {
        if (startTime <= now) {
          liveEvents.push(event)
        } else {
          upcomingEvents.push(event)
        }
      }
      if (startTime.getHours() < minHour) {
        minHour = startTime.getHours()
      }
      if (endTime.getHours() > maxHour) {
        maxHour = endTime.getHours()
      }
    })

  liveEvents = sortEvents(liveEvents)
  upcomingEvents = sortEvents(upcomingEvents)

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
          <div className="mt-2">
            <SearchBarTextItem param="search" />
          </div>
          <SearchBarTagItem
            param="club__code__in"
            label={OBJECT_NAME_TITLE}
            options={clubOptions}
          />
          <SearchBarTagItem
            param="club__tags__in"
            label="Tags"
            options={tagOptions}
          />
          {isClubFieldShown('badges') && (
            <SearchBarTagItem
              param="club__badges__in"
              label="Badges"
              options={badgeOptions}
            />
          )}
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
          <WideContainer background={SNOW} fullHeight>
            <ViewContext.Provider
              value={[
                viewOption,
                setViewOption,
                showSyncModal,
                viewsVisible,
                setViewsVisible,
              ]}
            >
              {viewOption === EventsViewOption.LIST ? (
                <>
                  {!!liveEvents.length && (
                    <>
                      <StyledHeader>
                        <div className="info">
                          <Title>Live Events</Title>
                          {fair != null && <Subtitle>{fair?.name}</Subtitle>}
                        </div>
                        <div className="tools">
                          <EventsViewToolbar
                            viewOption={viewOption}
                            setViewOption={setViewOption}
                            showSyncModal={showSyncModal}
                            viewsVisible={viewsVisible}
                            setViewsVisible={setViewsVisible}
                          />
                        </div>
                      </StyledHeader>
                      <CardList>
                        {liveEvents.map((e) => (
                          <EventCard
                            key={e.id}
                            event={e}
                            onClick={() => setPreviewEvent(e)}
                            onLinkClicked={() =>
                              logEvent(VisitType.EventLink, e.club)
                            }
                          />
                        ))}
                      </CardList>
                      <br />
                    </>
                  )}
                  <StyledHeader>
                    <div className="info">
                      <Title>Upcoming Events</Title>
                      {fair != null && <Subtitle>{fair?.name}</Subtitle>}
                    </div>
                    {!liveEvents.length && (
                      <div className="tools">
                        <EventsViewToolbar
                          viewOption={viewOption}
                          setViewOption={setViewOption}
                          showSyncModal={showSyncModal}
                          viewsVisible={viewsVisible}
                          setViewsVisible={setViewsVisible}
                        />
                      </div>
                    )}
                  </StyledHeader>
                  <CardList>
                    {upcomingEvents.map((e) => (
                      <EventCard
                        key={e.id}
                        event={e}
                        onClick={() => setPreviewEvent(e)}
                        onLinkClicked={() =>
                          logEvent(VisitType.EventLink, e.club)
                        }
                      />
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
                <div
                  style={{ height: `calc(100vh - ${FULL_NAV_HEIGHT} - 25px)` }}
                >
                  <Calendar
                    min={new Date(0, 0, 0, minHour, 0, 0)}
                    max={new Date(0, 0, 0, maxHour, 0, 0)}
                    localizer={localizer}
                    components={{
                      event: CalendarEvent,
                      toolbar: CalendarHeader,
                    }}
                    onSelectEvent={(event: { resource: ClubEvent }) => {
                      setPreviewEvent(event.resource)
                    }}
                    onRangeChange={fetchForDateRange}
                    events={calendarEvents.map((e) => ({
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
                          color: Color(color).isLight()
                            ? CLUBS_GREY_LIGHT
                            : WHITE,
                          border: 'none',
                        },
                      }
                    }}
                    style={{ flex: '1' }}
                  />
                </div>
              )}
            </ViewContext.Provider>
          </WideContainer>
        </SearchbarRightContainer>
      </div>
      {syncModalVisible && (
        <Modal
          show={syncModalVisible}
          closeModal={hideSyncModal}
          width="45%"
          marginBottom={false}
        >
          <SyncModal />
        </Modal>
      )}
      {previewEvent && (
        <Modal
          show={true}
          closeModal={hideModal}
          width="45%"
          marginBottom={false}
        >
          <EventModal
            event={previewEvent}
            showDetailsButton={true}
            onLinkClicked={() =>
              logEvent(VisitType.EventLink, previewEvent.club)
            }
          />
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

  const dateRange = getDefaultDateRange()

  const cachedFairList: ClubFair[] =
    ctx.query.fair != null
      ? [
          await doApiRequest(
            `/clubfairs/${encodeURIComponent(
              ctx.query.fair as string,
            )}/?format=json`,
          ).then((resp) => resp.json()),
        ]
      : await cache(
          'pages:events:fair',
          async () => {
            return doApiRequest(
              '/clubfairs/current/?format=json',
            ).then((resp) => resp.json())
          },
          60 * 1000,
        )

  const cachedFair = cachedFairList.length > 0 ? cachedFairList[0] : null

  const cachedInfoReq = cache(
    `pages:events:${cachedFair?.id}`,
    async () => {
      const [tags, badges, clubs] = await Promise.all([
        doApiRequest('/tags/?format=json', data).then((resp) => resp.json()),
        doApiRequest(
          `/badges/?fair=${cachedFair?.id}&format=json`,
          data,
        ).then((resp) => resp.json()),
        doApiRequest('/clubs/directory/?format=json', data)
          .then((resp) => resp.json())
          .then((resp) => resp.filter(({ approved }) => approved)),
      ])
      return { tags, badges, clubs }
    },
    5 * 60 * 1000,
  )

  const params = new URLSearchParams()
  const startStr = dateRange.start.toISOString()
  const endStr = dateRange.end.toISOString()
  params.set('format', 'json')
  params.set('start_time__gte', startStr)
  params.set('end_time__lte', endStr)

  if (cachedFair != null) {
    params.set('type__in', ClubEventType.FAIR.toString())
    params.set('fair', cachedFair.id.toString())
  }

  const [events, cachedInfo] = await Promise.all([
    cache(
      `events:list:range:${cachedFair?.id}:${startStr}:${endStr}`,
      async () => {
        const resp = await doApiRequest(`/events/?${params.toString()}`, data)
        return await resp.json()
      },
      5 * 60 * 1000,
    ),
    cachedInfoReq,
  ])

  return {
    fair: cachedFair,
    events,
    dateRange,
    ...cachedInfo,
  }
}

export default renderPage(EventPage)
