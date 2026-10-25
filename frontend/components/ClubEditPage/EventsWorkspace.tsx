import { Field, Form, Formik, useFormikContext } from 'formik'
import moment from 'moment'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Club, ClubEvent, ClubEventType, EventShowing } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Icon, Modal, Text } from '../common'
import EventModal from '../EventPage/EventModal'
import {
  CheckboxField,
  DateTimeField,
  FileField,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { ADMIN_ACCENT, ADMIN_NAVY } from './adminTheme'
import { PageHeading, PageTitle, ViewLink } from './ClubAdminShell'
import { EVENT_TYPES } from './EventsCard'
import EventsImportCard from './EventsImportCard'

type ViewMode = 'table' | 'calendar'
type RangeMode = 'week' | 'month'

type EventDraft = {
  id: number | null
  showingId: number | null
  name: string
  type: number
  description: string
  url: string
  image: File | string | null
  image_url: string | null
  location: string
  location_visible_to_public: boolean
  start_time: string | null
  end_time: string | null
  recurring: boolean
  offset: string
  end_date: string | null
  ticket_drop_time: string | null
  ticket_order_limit: string
  extra_start: string | null
  extra_end: string | null
  extra_location: string
}

type Block = {
  key: string
  event: ClubEvent
  showing: EventShowing | null
  start: string
  end: string
  location: string | null
}

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
`

const Toggle = styled.div`
  display: inline-flex;
  background: white;
  border-radius: 999px;
  padding: 4px;
`

const ToggleButton = styled.button<{ $active?: boolean }>`
  border: 0;
  background: ${({ $active }) => ($active ? '#e7f6ee' : 'transparent')};
  color: ${({ $active }) => ($active ? '#178a4a' : ADMIN_NAVY)};
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
`

const Search = styled.input`
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  padding: 8px 12px;
  min-width: 160px;
  color: ${ADMIN_NAVY};
`

const ToolButton = styled.button`
  border: 1px solid #e4e4e4;
  background: white;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${ADMIN_NAVY};
`

const CreateWrap = styled.div`
  margin-left: auto;
  display: inline-flex;
  position: relative;
`

const CreateButton = styled.button`
  background: ${ADMIN_ACCENT};
  color: white;
  border: 0;
  border-radius: 6px 0 0 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
`

const CreateMore = styled.button`
  background: ${ADMIN_ACCENT};
  color: white;
  border: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 0 6px 6px 0;
  padding: 8px 10px;
  cursor: pointer;
`

const Menu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 10px;
  min-width: 200px;
  z-index: 4;
  padding: 6px;

  button {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    background: transparent;
    padding: 8px;
    cursor: pointer;
    color: ${ADMIN_NAVY};
  }
`

const CalendarHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: ${ADMIN_NAVY};
  font-weight: 600;
`

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: 52px repeat(7, minmax(0, 1fr));
  background: white;
  border-radius: 10px;
  overflow: auto;
  max-height: 720px;
  position: relative;
`

const DayHead = styled.div`
  position: sticky;
  top: 0;
  background: white;
  z-index: 2;
  text-align: center;
  font-size: 12px;
  padding: 8px 2px;
  border-bottom: 1px solid #eee;
  color: ${ADMIN_NAVY};
`

const HourLabel = styled.div`
  height: 48px;
  font-size: 11px;
  color: #888;
  text-align: right;
  padding-right: 6px;
`

const DayCol = styled.div`
  position: relative;
  border-left: 1px solid #f0f0f0;
  min-height: ${48 * 16}px;
`

const HourLine = styled.div`
  height: 48px;
  border-top: 1px solid #f3f3f3;
`

const BlockButton = styled.div<{ $dashed?: boolean; $active?: boolean }>`
  position: absolute;
  left: 4px;
  right: 4px;
  border-radius: 6px;
  border: 1px
    ${({ $dashed }) => ($dashed ? 'dashed #4f46e5' : 'solid transparent')};
  background: ${({ $dashed, $active }) =>
    $dashed ? 'white' : $active ? '#d9dcff' : 'white'};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  text-align: left;
  padding: 4px 6px;
  font-size: 12px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  z-index: 1;
  overflow: hidden;
`

const Popup = styled.div`
  position: absolute;
  left: 8px;
  top: 28px;
  width: 220px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 10px;
  z-index: 5;
  text-align: left;
`

const PopupActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-bottom: 6px;

  button {
    border: 0;
    background: transparent;
    cursor: pointer;
    color: ${ADMIN_NAVY};
  }
`

const Panel = styled.aside`
  background: white;
  border-radius: 10px;
  padding: 14px 14px 18px;
`

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`

const SaveRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`

const Primary = styled.button`
  background: ${ADMIN_ACCENT};
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    opacity: 0.5;
  }
`

const Secondary = styled.button`
  background: white;
  border: 1px solid #d8d8d8;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${ADMIN_NAVY};
`

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  background: white;
  border-radius: 10px;
  padding: 8px;
`

const MonthCell = styled.div`
  min-height: 88px;
  background: #fafafa;
  border-radius: 6px;
  padding: 4px;
  font-size: 12px;
  color: ${ADMIN_NAVY};
`

const TableCard = styled.div`
  background: white;
  border-radius: 10px;
  overflow: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    color: ${ADMIN_NAVY};
  }

  th,
  td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid #f2f2f2;
    font-size: 14px;
  }
`

const draftKey = (code: string) => `penn-clubs-event-draft:${code}`

function emptyDraft(recurring = false): EventDraft {
  return {
    id: null,
    showingId: null,
    name: '',
    type: ClubEventType.GBM,
    description: '',
    url: '',
    image: null,
    image_url: null,
    location: '',
    location_visible_to_public: false,
    start_time: null,
    end_time: null,
    recurring,
    offset: '7',
    end_date: null,
    ticket_drop_time: null,
    ticket_order_limit: '',
    extra_start: null,
    extra_end: null,
    extra_location: '',
  }
}

function draftFromEvent(
  event: ClubEvent,
  showing?: EventShowing | null,
): EventDraft {
  const first = showing || event.showings?.[0] || null
  return {
    ...emptyDraft(),
    id: event.id,
    showingId: first?.id ?? null,
    name: event.name,
    type: event.type,
    description: event.description || '',
    url: event.url || '',
    image: event.image_url,
    image_url: event.image_url,
    location: first?.location || '',
    location_visible_to_public: Boolean(first?.location_visible_to_public),
    start_time: first?.start_time || event.earliest_start_time || null,
    end_time: first?.end_time || event.latest_end_time || null,
    ticket_drop_time: first?.ticket_drop_time || null,
    ticket_order_limit: first?.ticket_order_limit
      ? String(first.ticket_order_limit)
      : '',
  }
}

function asApiDate(value: string | Date | null): string | null {
  if (!value) {
    return null
  }
  const parsed = moment(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ssZ') : null
}

function blocksFor(event: ClubEvent): Block[] {
  if (event.showings?.length) {
    return event.showings.map((showing) => ({
      key: `${event.id}-${showing.id}`,
      event,
      showing,
      start: showing.start_time,
      end: showing.end_time,
      location: showing.location,
    }))
  }
  if (event.earliest_start_time) {
    return [
      {
        key: `${event.id}-span`,
        event,
        showing: null,
        start: event.earliest_start_time,
        end: event.latest_end_time || event.earliest_start_time,
        location: null,
      },
    ]
  }
  return []
}

function recurrenceLabel(event: ClubEvent): string | null {
  const showings = event.showings || []
  if (showings.length < 2) {
    return null
  }
  const sorted = [...showings].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  )
  const days = moment(sorted[1].start_time).diff(
    moment(sorted[0].start_time),
    'days',
  )
  if (days === 7) {
    return `Weekly on ${moment(sorted[0].start_time).format('dddd')}s`
  }
  if (days > 0 && sorted.length > 2) {
    return `Every ${days} days`
  }
  return `${showings.length} dates`
}

function eventMatches(
  event: ClubEvent,
  query: string,
  typeFilter: string,
  showPast: boolean,
) {
  if (typeFilter !== '' && String(event.type) !== typeFilter) {
    return false
  }
  if (query && !event.name.toLowerCase().includes(query.toLowerCase())) {
    return false
  }
  if (!showPast && event.latest_end_time) {
    if (moment(event.latest_end_time).isBefore(moment().subtract(2, 'days'))) {
      return false
    }
  }
  return true
}

export default function EventsWorkspace({
  club,
}: {
  club: Club
}): ReactElement<any> {
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [view, setView] = useState<ViewMode>('calendar')
  const [range, setRange] = useState<RangeMode>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showPast, setShowPast] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [createMenu, setCreateMenu] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [seed, setSeed] = useState<EventDraft>(() => emptyDraft())
  const [seedKey, setSeedKey] = useState(0)
  const [panelOpen, setPanelOpen] = useState(true)
  const [showExtra, setShowExtra] = useState(false)
  const [savedDraft, setSavedDraft] = useState(false)

  const reload = () => {
    doApiRequest(`/clubs/${club.code}/events/?format=json`)
      .then((resp) => resp.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
  }

  useEffect(() => {
    reload()
    setSavedDraft(Boolean(window.sessionStorage.getItem(draftKey(club.code))))
  }, [club.code])

  const openNew = (recurring = false) => {
    setSeed(emptyDraft(recurring))
    setSeedKey((key) => key + 1)
    setPanelOpen(true)
    setShowExtra(false)
    setCreateMenu(false)
  }

  const openEvent = (event: ClubEvent, showing?: EventShowing | null) => {
    setSeed(draftFromEvent(event, showing))
    setSeedKey((key) => key + 1)
    setPanelOpen(true)
    setShowExtra(false)
  }

  const visibleEvents = events.filter((event) =>
    eventMatches(event, query, typeFilter, showPast || view === 'calendar'),
  )

  const save = async (values: EventDraft) => {
    const base = `/clubs/${club.code}/events/`
    const image = values.image instanceof File ? values.image : null
    if (!values.id) {
      if (!values.start_time || !values.end_time) {
        toast.error('Start and end are required')
        return
      }
      const body: Record<string, unknown> = {
        name: values.name,
        type: values.type,
        description: values.description,
        url: values.url,
        start_time: asApiDate(values.start_time),
        end_time: asApiDate(values.end_time),
        location: values.location,
        location_visible_to_public: values.location_visible_to_public,
      }
      if (values.recurring) {
        const offset = Number(values.offset || 7)
        const end = asApiDate(values.end_date)
        const start = asApiDate(values.start_time)
        if (
          !end ||
          !start ||
          !Number.isFinite(offset) ||
          offset < 1 ||
          !moment(end).isAfter(moment(start))
        ) {
          toast.error(
            'Recurring events need an interval of at least 1 day and an end date after the start.',
          )
          return
        }
        body.offset = offset
        body.end_date = end
      }
      const resp = await doApiRequest(`${base}?format=json`, {
        method: 'POST',
        body,
      })
      const json = await resp.json()
      if (!resp.ok) {
        toast.error(formatResponse(json))
        return
      }
      if (image && json.id) {
        const data = new FormData()
        data.append('image', image)
        await doApiRequest(`${base}${json.id}/?format=json`, {
          method: 'PATCH',
          body: data,
        })
      }
      toast.success('Event saved')
      window.sessionStorage.removeItem(draftKey(club.code))
      setSavedDraft(false)
      reload()
      if (json.id) {
        openEvent(json as ClubEvent)
      }
      return
    }

    const resp = await doApiRequest(`${base}${values.id}/?format=json`, {
      method: 'PATCH',
      body: {
        name: values.name,
        type: values.type,
        description: values.description,
        url: values.url,
      },
    })
    const json = await resp.json()
    if (!resp.ok) {
      toast.error(formatResponse(json))
      return
    }
    if (image) {
      const data = new FormData()
      data.append('image', image)
      await doApiRequest(`${base}${values.id}/?format=json`, {
        method: 'PATCH',
        body: data,
      })
    }
    if (values.showingId && values.start_time && values.end_time) {
      const showingResp = await doApiRequest(
        `/events/${values.id}/showings/${values.showingId}/?format=json`,
        {
          method: 'PATCH',
          body: {
            start_time: asApiDate(values.start_time),
            end_time: asApiDate(values.end_time),
            location: values.location,
            location_visible_to_public: values.location_visible_to_public,
            ticket_drop_time: values.ticket_drop_time
              ? asApiDate(values.ticket_drop_time)
              : null,
            ticket_order_limit: values.ticket_order_limit
              ? Number(values.ticket_order_limit)
              : undefined,
          },
        },
      )
      if (!showingResp.ok) {
        toast.error(formatResponse(await showingResp.json()))
        return
      }
    }
    toast.success('Event saved')
    reload()
  }

  const removeEvent = async (event: ClubEvent) => {
    if (!window.confirm(`Delete ${event.name}?`)) {
      return
    }
    const resp = await doApiRequest(
      `/clubs/${club.code}/events/${event.id}/?format=json`,
      { method: 'DELETE' },
    )
    if (!resp.ok) {
      toast.error('Could not delete that event')
      return
    }
    toast.success('Event deleted')
    if (seed.id === event.id) {
      openNew()
    }
    reload()
  }

  const addShowing = async (values: EventDraft) => {
    if (!values.id || !values.extra_start || !values.extra_end) {
      toast.error('Save the event, then add a start and end for the new date')
      return
    }
    const resp = await doApiRequest(
      `/events/${values.id}/showings/?format=json`,
      {
        method: 'POST',
        body: {
          start_time: asApiDate(values.extra_start),
          end_time: asApiDate(values.extra_end),
          location: values.extra_location,
          location_visible_to_public: values.location_visible_to_public,
        },
      },
    )
    const json = await resp.json()
    if (!resp.ok) {
      toast.error(formatResponse(json))
      return
    }
    toast.success('Date added')
    setShowExtra(false)
    reload()
  }

  return (
    <>
      <PageHeading>
        <PageTitle>Events</PageTitle>
      </PageHeading>
      {!(club.approved || club.is_ghost) && (
        <Text>
          Note: you must be an approved club to create publicly-viewable events.
        </Text>
      )}
      <Formik
        key={seedKey}
        initialValues={seed}
        enableReinitialize
        onSubmit={save}
      >
        {(formik) => (
          <Form>
            <Toolbar>
              <Toggle>
                <ToggleButton
                  type="button"
                  $active={view === 'table'}
                  onClick={() => setView('table')}
                >
                  <Icon name="list" alt="" /> Table
                </ToggleButton>
                <ToggleButton
                  type="button"
                  $active={view === 'calendar'}
                  onClick={() => setView('calendar')}
                >
                  <Icon name="calendar" alt="" /> Calendar
                </ToggleButton>
              </Toggle>
              <Search
                placeholder="Search..."
                aria-label="Search events"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div style={{ position: 'relative' }}>
                <ToolButton
                  type="button"
                  onClick={() => setFilterOpen((open) => !open)}
                >
                  Filter
                </ToolButton>
                {filterOpen && (
                  <Menu style={{ position: 'absolute', left: 0 }}>
                    <label>
                      Type{' '}
                      <select
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value)}
                      >
                        <option value="">All</option>
                        {EVENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: 'block', marginTop: 8 }}>
                      <input
                        type="checkbox"
                        checked={showPast}
                        onChange={(event) => setShowPast(event.target.checked)}
                      />{' '}
                      Include past events
                    </label>
                  </Menu>
                )}
              </div>
              <select
                aria-label="Calendar range"
                value={range}
                onChange={(event) => setRange(event.target.value as RangeMode)}
                style={{ width: 'auto' }}
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <CreateWrap>
                <CreateButton type="button" onClick={() => openNew(false)}>
                  + Create Event
                </CreateButton>
                <CreateMore
                  type="button"
                  aria-label="More create options"
                  onClick={() => setCreateMenu((open) => !open)}
                >
                  ▾
                </CreateMore>
                {createMenu && (
                  <Menu>
                    <button type="button" onClick={() => openNew(true)}>
                      Make recurring
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImportOpen(true)
                        setCreateMenu(false)
                      }}
                    >
                      Import calendar
                    </button>
                    {savedDraft && (
                      <button
                        type="button"
                        onClick={() => {
                          const raw = window.sessionStorage.getItem(
                            draftKey(club.code),
                          )
                          if (!raw) {
                            return
                          }
                          setSeed({
                            ...emptyDraft(),
                            ...JSON.parse(raw),
                            image: null,
                          })
                          setSeedKey((key) => key + 1)
                          setPanelOpen(true)
                          setCreateMenu(false)
                        }}
                      >
                        Open saved draft
                      </button>
                    )}
                  </Menu>
                )}
              </CreateWrap>
            </Toolbar>
            <Layout>
              <div>
                {view === 'table' ? (
                  <EventsTable
                    events={visibleEvents}
                    onEdit={openEvent}
                    onDelete={removeEvent}
                  />
                ) : range === 'week' ? (
                  <WeekCalendar
                    anchor={anchor}
                    setAnchor={setAnchor}
                    events={visibleEvents}
                    draft={formik.values}
                    onEdit={openEvent}
                    onDelete={removeEvent}
                  />
                ) : (
                  <MonthCalendar
                    anchor={anchor}
                    setAnchor={setAnchor}
                    events={visibleEvents}
                    onEdit={openEvent}
                  />
                )}
              </div>
              {panelOpen && (
                <EventPanel
                  showExtra={showExtra}
                  setShowExtra={setShowExtra}
                  onClose={() => setPanelOpen(false)}
                  onPreview={() => setPreview(true)}
                  onDraft={() => {
                    const { image, ...rest } = formik.values
                    window.sessionStorage.setItem(
                      draftKey(club.code),
                      JSON.stringify(rest),
                    )
                    setSavedDraft(true)
                    toast.success(
                      'Draft saved on this device. It is not published.',
                    )
                  }}
                  onAddShowing={() => addShowing(formik.values)}
                  saving={formik.isSubmitting}
                />
              )}
            </Layout>
            {preview && (
              <Modal show closeModal={() => setPreview(false)} width="420px">
                <EventModal
                  event={
                    {
                      ...formik.values,
                      id: formik.values.id || 0,
                      club_name: club.name,
                      image_url:
                        formik.values.image instanceof File
                          ? URL.createObjectURL(formik.values.image)
                          : formik.values.image_url,
                      showings: [],
                      affiliations: [],
                      club: club.code,
                      is_ics_event: false,
                      large_image_url: null,
                      ticketed: false,
                      pinned: false,
                    } as ClubEvent
                  }
                  start_time={String(formik.values.start_time || '')}
                  end_time={String(formik.values.end_time || '')}
                />
              </Modal>
            )}
          </Form>
        )}
      </Formik>
      {importOpen && (
        <Modal show closeModal={() => setImportOpen(false)} width="640px">
          <EventsImportCard
            club={club}
            onFetchEvents={() => {
              reload()
            }}
          />
        </Modal>
      )}
    </>
  )
}

function EventsTable({
  events,
  onEdit,
  onDelete,
}: {
  events: ClubEvent[]
  onEdit: (event: ClubEvent) => void
  onDelete: (event: ClubEvent) => void
}) {
  return (
    <TableCard>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Start</th>
            <th>Type</th>
            <th>Dates</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>
                {event.earliest_start_time
                  ? moment(event.earliest_start_time).format('MMM D, h:mma')
                  : ''}
              </td>
              <td>
                {EVENT_TYPES.find((type) => type.value === event.type)?.label ||
                  'Other'}
              </td>
              <td>{event.showings?.length ?? 0}</td>
              <td>
                <button type="button" onClick={() => onEdit(event)}>
                  Edit
                </button>{' '}
                <Link href={`/events/${event.id}`}>Page</Link>{' '}
                <button type="button" onClick={() => onDelete(event)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}

function WeekCalendar({
  anchor,
  setAnchor,
  events,
  draft,
  onEdit,
  onDelete,
}: {
  anchor: Date
  setAnchor: (date: Date) => void
  events: ClubEvent[]
  draft: EventDraft
  onEdit: (event: ClubEvent, showing?: EventShowing | null) => void
  onDelete: (event: ClubEvent) => void
}) {
  const [hover, setHover] = useState<string | null>(null)
  const start = moment(anchor).startOf('isoWeek')
  const days = Array.from({ length: 7 }, (_, index) =>
    start.clone().add(index, 'days'),
  )
  const blocks = events.flatMap(blocksFor).filter((block) => {
    const when = moment(block.start)
    return (
      when.isSameOrAfter(start, 'day') &&
      when.isBefore(start.clone().add(7, 'days'), 'day')
    )
  })
  const hours = Array.from({ length: 16 }, (_, index) => index + 7)

  const place = (startTime: string, endTime: string) => {
    const startMoment = moment(startTime)
    const endMoment = moment(endTime)
    const startMinutes = startMoment.hours() * 60 + startMoment.minutes()
    const endMinutes = Math.max(
      endMoment.hours() * 60 + endMoment.minutes(),
      startMinutes + 30,
    )
    const top = Math.max(0, ((startMinutes - 7 * 60) / 60) * 48)
    const height = Math.max(((endMinutes - startMinutes) / 60) * 48, 28)
    return { top, height, dayIndex: startMoment.isoWeekday() - 1 }
  }

  const draftBlock =
    !draft.id && draft.start_time && draft.end_time
      ? {
          ...place(String(draft.start_time), String(draft.end_time)),
          name: draft.name || 'New Event',
        }
      : null

  return (
    <div>
      <CalendarHead>
        <button
          type="button"
          onClick={() => setAnchor(start.clone().subtract(1, 'week').toDate())}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setAnchor(start.clone().add(1, 'week').toDate())}
        >
          ›
        </button>
        <span>{start.format('MMMM YYYY')}</span>
      </CalendarHead>
      <WeekGrid>
        <DayHead />
        {days.map((day) => (
          <DayHead key={day.toISOString()}>
            <div>{day.format('D')}</div>
            <div>{day.format('ddd').toUpperCase()}</div>
          </DayHead>
        ))}
        <div>
          {hours.map((hour) => (
            <HourLabel key={hour}>
              {moment().hour(hour).minute(0).format('h A')}
            </HourLabel>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <DayCol key={day.toISOString()}>
            {hours.map((hour) => (
              <HourLine key={hour} />
            ))}
            {blocks
              .filter(
                (block) => place(block.start, block.end).dayIndex === dayIndex,
              )
              .map((block) => {
                const position = place(block.start, block.end)
                const event = block.event
                return (
                  <BlockButton
                    key={block.key}
                    style={{ top: position.top, height: position.height }}
                    $active={draft.id === event.id}
                    onMouseEnter={() => setHover(block.key)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onEdit(event, block.showing)}
                  >
                    <strong>{event.name}</strong>
                    <div>
                      {moment(block.start).format('h:mm A')} –{' '}
                      {moment(block.end).format('h:mm A')}
                    </div>
                    {hover === block.key && (
                      <Popup onMouseEnter={() => setHover(block.key)}>
                        <PopupActions>
                          <button
                            type="button"
                            aria-label="Edit event"
                            onClick={(click) => {
                              click.stopPropagation()
                              onEdit(event, block.showing)
                            }}
                          >
                            <Icon name="edit" alt="" />
                          </button>
                          <button
                            type="button"
                            aria-label="Copy meeting link"
                            onClick={async (click) => {
                              click.stopPropagation()
                              if (!event.url) {
                                toast.info('This event has no meeting link')
                                return
                              }
                              await navigator.clipboard.writeText(event.url)
                              toast.success('Meeting link copied')
                            }}
                          >
                            <Icon name="mail" alt="" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete event"
                            onClick={(click) => {
                              click.stopPropagation()
                              onDelete(event)
                            }}
                          >
                            <Icon name="trash" alt="" />
                          </button>
                          <button
                            type="button"
                            aria-label="Close"
                            onClick={(click) => {
                              click.stopPropagation()
                              setHover(null)
                            }}
                          >
                            <Icon name="x" alt="" />
                          </button>
                        </PopupActions>
                        <strong>{event.name}</strong>
                        <div>{moment(block.start).format('dddd, MMMM Do')}</div>
                        <div>
                          {moment(block.start).format('h:mm A')} –{' '}
                          {moment(block.end).format('h:mm A')}
                        </div>
                        {recurrenceLabel(event) && (
                          <div>{recurrenceLabel(event)}</div>
                        )}
                        {event.url && (
                          <a href={event.url} target="_blank" rel="noreferrer">
                            {event.url}
                          </a>
                        )}
                        {block.showing && (
                          <div>
                            <Link
                              href={`/events/${event.id}/tickets/${block.showing.id}/?action=create`}
                              target="_blank"
                            >
                              {block.showing.ticketed
                                ? 'Manage tickets'
                                : 'Add tickets'}
                            </Link>
                          </div>
                        )}
                      </Popup>
                    )}
                  </BlockButton>
                )
              })}
            {draftBlock && draftBlock.dayIndex === dayIndex && (
              <BlockButton
                $dashed
                style={{ top: draftBlock.top, height: draftBlock.height }}
              >
                <strong>{draftBlock.name}</strong>
              </BlockButton>
            )}
          </DayCol>
        ))}
      </WeekGrid>
    </div>
  )
}

function MonthCalendar({
  anchor,
  setAnchor,
  events,
  onEdit,
}: {
  anchor: Date
  setAnchor: (date: Date) => void
  events: ClubEvent[]
  onEdit: (event: ClubEvent, showing?: EventShowing | null) => void
}) {
  const start = moment(anchor).startOf('month').startOf('isoWeek')
  const cells = Array.from({ length: 42 }, (_, index) =>
    start.clone().add(index, 'days'),
  )
  const blocks = events.flatMap(blocksFor)
  return (
    <div>
      <CalendarHead>
        <button
          type="button"
          onClick={() =>
            setAnchor(moment(anchor).subtract(1, 'month').toDate())
          }
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setAnchor(moment(anchor).add(1, 'month').toDate())}
        >
          ›
        </button>
        <span>{moment(anchor).format('MMMM YYYY')}</span>
      </CalendarHead>
      <MonthGrid>
        {cells.map((day) => (
          <MonthCell key={day.toISOString()}>
            <strong>{day.format('D')}</strong>
            {blocks
              .filter((block) => moment(block.start).isSame(day, 'day'))
              .map((block) => (
                <button
                  key={block.key}
                  type="button"
                  onClick={() => onEdit(block.event, block.showing)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: ADMIN_NAVY,
                  }}
                >
                  {moment(block.start).format('h:mma')} {block.event.name}
                </button>
              ))}
          </MonthCell>
        ))}
      </MonthGrid>
    </div>
  )
}

function EventPanel({
  showExtra,
  setShowExtra,
  onClose,
  onPreview,
  onDraft,
  onAddShowing,
  saving,
}: {
  showExtra: boolean
  setShowExtra: (value: boolean) => void
  onClose: () => void
  onPreview: () => void
  onDraft: () => void
  onAddShowing: () => void
  saving: boolean
}) {
  const { values } = useFormikContext<EventDraft>()
  return (
    <Panel>
      <PanelHead>
        <button type="button" aria-label="Close editor" onClick={onClose}>
          ‹
        </button>
        <strong>{values.id ? 'Edit Event' : 'New Event'}</strong>
        <ViewLink
          as="button"
          type="button"
          onClick={onPreview}
          style={{
            marginLeft: 8,
            fontSize: 16,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
          }}
        >
          Preview Event <Icon name="external-link" alt="" size="0.9rem" />
        </ViewLink>
        <button
          type="button"
          aria-label="Add another date"
          title={
            values.id
              ? 'Add another date'
              : 'Save the event before adding another date'
          }
          onClick={() => setShowExtra(!showExtra)}
          style={{
            marginLeft: 'auto',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" alt="" />
        </button>
      </PanelHead>
      <Field name="name" as={TextField} label="Name" />
      <Field
        name="type"
        as={SelectField}
        label="Type"
        choices={EVENT_TYPES}
        isMulti={false}
        required
        serialize={({ value }) => value}
        valueDeserialize={(val) =>
          EVENT_TYPES.find((item) => item.value === val)
        }
      />
      <Field name="start_time" as={DateTimeField} label="Start" />
      <Field name="end_time" as={DateTimeField} label="End" />
      <Field
        name="location"
        as={TextField}
        label="Add Location..."
        placeholder="Add Location..."
      />
      <Field
        name="url"
        as={TextField}
        label="Add Link..."
        placeholder="Add Link..."
        type="url"
      />
      <Field name="image" as={FileField} label="Add Image..." isImage />
      <Field
        name="description"
        as={RichTextField}
        label="Description"
        placeholder="Description"
      />
      <Field
        name="location_visible_to_public"
        as={CheckboxField}
        label="Show the location to people who are not signed in"
      />
      {!values.id && (
        <>
          <Field name="recurring" as={CheckboxField} label="Make recurring" />
          {values.recurring && (
            <>
              <Field
                name="offset"
                as={TextField}
                label="Days between dates"
                type="number"
              />
              <Field name="end_date" as={DateTimeField} label="Repeat until" />
            </>
          )}
        </>
      )}
      {values.id && (
        <>
          <Field
            name="ticket_drop_time"
            as={DateTimeField}
            label="Ticket drop time"
          />
          <Field
            name="ticket_order_limit"
            as={TextField}
            label="Ticket order limit"
            type="number"
          />
          {values.showingId && (
            <p>
              <Link
                href={`/events/${values.id}/tickets/${values.showingId}/?action=create`}
                target="_blank"
              >
                Manage tickets
              </Link>
            </p>
          )}
          <p>
            <Link href={`/events/${values.id}`} target="_blank">
              Public event page
            </Link>
          </p>
        </>
      )}
      {showExtra && (
        <div>
          <h3>Another date</h3>
          <Field name="extra_start" as={DateTimeField} label="Start" />
          <Field name="extra_end" as={DateTimeField} label="End" />
          <Field name="extra_location" as={TextField} label="Location" />
          <Secondary type="button" onClick={onAddShowing}>
            Add date
          </Secondary>
        </div>
      )}
      <SaveRow>
        <Primary type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Event'}
        </Primary>
        <Secondary type="button" onClick={onDraft}>
          Save Draft
        </Secondary>
      </SaveRow>
    </Panel>
  )
}
