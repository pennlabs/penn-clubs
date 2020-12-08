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
import styled from 'styled-components'

import { EVENT_TYPES } from '../components/ClubEditPage/EventsCard'
import {
  Icon,
  Metadata,
  Modal,
  Title,
  WideContainer,
} from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import EventCard from '../components/EventPage/EventCard'
import EventModal, { MEETING_REGEX } from '../components/EventPage/EventModal'
import SyncModal from '../components/EventPage/SyncModal'
import { FuseTag } from '../components/FilterSearch'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from '../components/SearchBar'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  EVENT_TYPE_COLORS,
  FULL_NAV_HEIGHT,
  SNOW,
  WHITE_ALPHA,
} from '../constants'
import renderPage from '../renderPage'
import { Badge, ClubEvent, ClubEventType, Tag } from '../types'
import { doApiRequest, isClubFieldShown, useSetting } from '../utils'
import { OBJECT_NAME_SINGULAR } from '../utils/branding'
import { ListLoadIndicator } from '.'

interface EventPageProps {
  authenticated: boolean | null
  liveEvents: ClubEvent[]
  upcomingEvents: ClubEvent[]
  tags: Tag[]
  badges: Badge[]
  calendarURL: string
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
}): ReactElement => (
  <div style={{ display: 'flex' }}>
    <div className="buttons has-addons mt-0 mb-0">
      <button
        id="event-view-list"
        className={`button is-medium ${
          viewOption === EventsViewOption.LIST ? 'is-selected is-info' : ''
        }`}
        aria-label="switch to grid view"
        onClick={() => {
          setViewOption(EventsViewOption.LIST)
        }}
      >
        <Icon name="grid" alt="grid view" />
      </button>
      <button
        id="event-view-calendar"
        className={`button is-medium ${
          viewOption === EventsViewOption.CALENDAR ? 'is-selected is-info' : ''
        }`}
        aria-label="switch to calendar view"
        onClick={() => {
          setViewOption(EventsViewOption.CALENDAR)
        }}
      >
        <Icon name="calendar" alt="calendar view" />
      </button>
    </div>
    {/* margins are for matching vertical alignments with grouped buttons */}
    <button
      onClick={() => {
        showSyncModal && showSyncModal()
      }}
      className="button is-medium"
      style={{ marginLeft: '20px', marginBottom: '8px' }}
    >
      <Icon name="plus" />
      Sync
    </button>
  </div>
)

const CalendarHeader = ({
  label,
  onNavigate,
  onView,
  view,
}: CalendarHeaderProps) => {
  const [viewOption, setViewOption, showSyncModal] = useContext(ViewContext)
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
        />
      </div>
    </StyledHeader>
  )
}

const SyncButton = styled.a`
  background-color: ${CLUBS_BLUE};
  color: ${WHITE_ALPHA(0.8)} !important;
  float: right;
  padding: 8px;
`

const iconStylesDark = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${WHITE_ALPHA(0.8)} !important`,
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
  calendarURL,
}: EventPageProps): ReactElement {
  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>(() =>
    randomizeEvents(initialUpcomingEvents),
  )
  const [liveEvents, setLiveEvents] = useState<ClubEvent[]>(() =>
    randomizeEvents(initialLiveEvents),
  )
  const [calendarEvents, setCalendarEvents] = useState<ClubEvent[]>(() => [
    ...initialLiveEvents,
    ...initialUpcomingEvents,
  ])

  const isFair = useSetting('FAIR_OPEN')

  // during an activities fair, use list view and filter fair events by default
  const [searchInput, setSearchInput] = useState<SearchInput>(
    isFair ? { type__in: ClubEventType.FAIR.toString() } : {},
  )
  const currentSearch = useRef<SearchInput>({})
  const [isLoading, setLoading] = useState<boolean>(false)
  const [syncModalVisible, setSyncModalVisible] = useState<boolean>(false)

  const showSyncModal = () => setSyncModalVisible(true)
  const hideSyncModal = () => setSyncModalVisible(false)

  const [viewOption, setViewOption] = useState<EventsViewOption>(
    isFair ? EventsViewOption.LIST : EventsViewOption.CALENDAR,
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

  /**
   * Given a date range from big calendar, fetch the events associated with that date range.
   */
  const fetchForDateRange = (
    range: Date[] | { start: Date; end: Date },
  ): void => {
    if (Array.isArray(range)) {
      if (range.length === 1) {
        range = {
          start: range[0],
          end: new Date(range[0].getTime() + 60 * 60 * 24 * 1000),
        }
      } else {
        const max = new Date(Math.max(...((range as unknown) as number[])))
        const min = new Date(Math.min(...((range as unknown) as number[])))
        range = { start: min, end: max }
      }
    }
    doApiRequest(
      `/events/?format=json&start_time__gte=${range.start.toISOString()}&end_time__lte=${range.end.toISOString()}`,
    )
      .then((resp) => resp.json())
      .then(setCalendarEvents)
  }

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
          <WideContainer background={SNOW} fullHeight>
            <SyncButton onClick={showSyncModal}>
              <Icon name="plus" alt="create club" style={iconStylesDark} />
              Sync To Calendar
            </SyncButton>
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
                    <EventCard key={e.id} event={e} />
                  ))}
                </CardList>
                <br />
              </>
            )}
            <Title className="title" style={{ color: CLUBS_GREY }}>
              Upcoming Events
            </Title>
            {isLoading && <ListLoadIndicator />}
            <ViewContext.Provider
              value={[viewOption, setViewOption, showSyncModal]}
            >
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
                        <EventsViewToolbar
                          viewOption={viewOption}
                          setViewOption={setViewOption}
                          showSyncModal={showSyncModal}
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Title
                      className="title"
                      style={{
                        color: CLUBS_GREY,
                        marginTop: !liveEvents.length ? '30px' : 'unset',
                      }}
                    >
                      Upcoming Events
                    </Title>
                    {!liveEvents.length && (
                      <EventsViewToolbar
                        viewOption={viewOption}
                        setViewOption={setViewOption}
                        showSyncModal={showSyncModal}
                      />
                    )}
                  </div>
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
                <div
                  style={{ height: `calc(100vh - ${FULL_NAV_HEIGHT} - 25px)` }}
                >
                  <Calendar
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
                          color: CLUBS_GREY_LIGHT,
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
        <Modal show={syncModalVisible} closeModal={hideSyncModal} width="45%">
          <SyncModal calendarURL={calendarURL} />
        </Modal>
      )}
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

  const [
    liveEvents,
    upcomingEvents,
    tags,
    badges,
    calendar,
  ] = await Promise.all([
    doApiRequest('/events/live/?format=json', data).then((resp) => resp.json()),
    doApiRequest('/events/upcoming/?format=json', data).then((resp) =>
      resp.json(),
    ),
    doApiRequest('/tags/?format=json', data).then((resp) => resp.json()),
    doApiRequest('/badges/?format=json', data).then((resp) => resp.json()),
    doApiRequest('/settings/calendar_url/?format=json', data).then((resp) =>
      resp.json(),
    ),
  ])

  return {
    liveEvents,
    upcomingEvents,
    tags,
    badges,
    calendarURL: calendar.url,
  }
}

export default renderPage(EventPage)
