import { Field, Form, Formik, useFormikContext } from 'formik'
import moment from 'moment'
import Link from 'next/link'
import { ReactElement, useEffect, useRef, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Club, ClubEvent, ClubEventType, EventShowing } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { Icon, Modal, Text } from '../common'
import Table from '../common/Table'
import {
  selectCompactStyles,
  selectComponents,
  selectMenuPortalTarget,
  selectMenuStylesWhite,
} from '../common/selectStyles'
import EventModal from '../EventPage/EventModal'
import {
  CheckboxField,
  DateTimeField,
  FileField,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { ADMIN_ACCENT, ADMIN_CANVAS, ADMIN_NAVY } from './adminTheme'
import { PageTitle, ViewLink } from './ClubAdminShell'
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

const Fill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const FormFill = styled(Form)`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const Layout = styled.div<{ $panel?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $panel }) =>
    $panel
      ? 'minmax(0, 1.5fr) minmax(280px, 0.8fr)'
      : 'minmax(0, 1fr)'};
  gap: 16px;
  align-items: stretch;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`

const Column = styled.section`
  background: ${ADMIN_CANVAS};
  border: 0;
  border-radius: 10px;
  padding: 18px 16px 16px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const HeadStack = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 12px;
  justify-content: flex-start;
  margin: 0 0 12px;
`

const ColumnHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
`

const GhostButton = styled.button`
  background: white;
  border: 1px solid #d8d8d8;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${ADMIN_NAVY};
`


const Widget = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px 14px 14px;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`

const Toggle = styled.div`
  display: inline-flex;
  align-items: center;
  background: white;
  border-radius: 999px;
  padding: 4px;
`

const ToggleButton = styled.button<{ $active?: boolean }>`
  align-items: center;
  background: ${({ $active }) => ($active ? '#e7f6ee' : 'transparent')};
  border: 0;
  border-radius: 999px;
  color: ${({ $active }) => ($active ? '#178a4a' : ADMIN_NAVY)};
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  line-height: 1;
  padding: 6px 12px;

  svg {
    display: block;
  }
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
  display: inline-flex;
  align-items: stretch;
  position: relative;
  background: ${ADMIN_ACCENT};
  border-radius: 8px;
  overflow: visible;
`

const CreateButton = styled.button`
  appearance: none;
  background: transparent;
  color: #fff;
  border: 0;
  padding: 9px 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  line-height: 1;
`

const CreateMore = styled.button`
  appearance: none;
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  padding: 0 10px;

  svg {
    color: #fff;
    display: block;
  }
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

const HOUR_PX = 48
const DAY_HOURS = 24
const HOUR_TOP = 12

const CalendarHead = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-bottom: 14px;
  color: ${ADMIN_NAVY};
`

const MonthLabel = styled.span`
  color: ${ADMIN_NAVY};
  font-size: 21px;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 21px;
`

const NavButton = styled.button`
  appearance: none;
  background: transparent;
  border: 0;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 21px;
  width: 21px;
  padding: 0;
  line-height: 0;

  svg {
    display: block;
    stroke-width: 3.25;
  }
`

const BackButton = styled.button`
  appearance: none;
  align-items: center;
  background: white;
  border: 0;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;

  svg {
    display: block;
    stroke-width: 2.75;
  }
`

const CalendarFill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding-top: 8px;
`

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: 52px repeat(7, minmax(0, 1fr));
  background: white;
  border-radius: 10px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  position: relative;
`

const DayHead = styled.div`
  position: sticky;
  top: 0;
  background: white;
  z-index: 2;
  text-align: center;
  padding: 8px 2px;
  color: ${ADMIN_NAVY};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  .day-num {
    font-size: 24px;
    font-weight: 650;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .day-name {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.04em;
    line-height: 1;
  }
`

const HourGutter = styled.div`
  padding-top: ${HOUR_TOP}px;
`

const HourLabel = styled.div`
  height: ${HOUR_PX}px;
  font-size: 11px;
  color: #888;
  text-align: right;
  padding: 0 6px 0 0;
  line-height: 1;
  border-top: 1px solid #f3f3f3;
  transform: translateY(-6px);
`

const DayCol = styled.div`
  position: relative;
  border-left: 1px solid #f0f0f0;
  min-height: ${HOUR_TOP + HOUR_PX * DAY_HOURS}px;
  padding-top: ${HOUR_TOP}px;
  user-select: none;
  box-sizing: border-box;
`

const HourLine = styled.div`
  height: ${HOUR_PX}px;
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

const Panel = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`

const PanelBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const SaveRow = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
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
  flex: 1;
  min-height: 0;
  overflow: auto;
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
  flex: 1;
  min-height: 0;
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

type StoredDraft = {
  storageId: string
  savedAt: number
} & Omit<EventDraft, 'image'>

const draftKey = (code: string) => `penn-clubs-event-drafts:${code}`
const legacyDraftKey = (code: string) => `penn-clubs-event-draft:${code}`

function loadDrafts(code: string): StoredDraft[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.sessionStorage.getItem(draftKey(code))
    if (raw) {
      return JSON.parse(raw) as StoredDraft[]
    }
    const legacy = window.sessionStorage.getItem(legacyDraftKey(code))
    if (!legacy) {
      return []
    }
    const parsed = JSON.parse(legacy) as Omit<EventDraft, 'image'>
    const migrated: StoredDraft = {
      ...parsed,
      storageId: `${Date.now()}`,
      savedAt: Date.now(),
    }
    window.sessionStorage.setItem(draftKey(code), JSON.stringify([migrated]))
    window.sessionStorage.removeItem(legacyDraftKey(code))
    return [migrated]
  } catch {
    return []
  }
}

function saveDrafts(code: string, drafts: StoredDraft[]) {
  window.sessionStorage.setItem(draftKey(code), JSON.stringify(drafts))
}

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

function placeholderEvents(club: Club): ClubEvent[] {
  const monday = moment().startOf('isoWeek')
  const make = (
    id: number,
    name: string,
    type: ClubEventType,
    description: string,
    day: number,
    hour: number,
    hours: number,
    location: string,
  ): ClubEvent => {
    const start = monday.clone().add(day, 'day').hour(hour).minute(0).second(0)
    const end = start.clone().add(hours, 'hours')
    const showing: EventShowing = {
      id: id * 10,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location,
      location_visible_to_public: true,
      ticket_order_limit: 0,
      ticketed: false,
    }
    return {
      affiliations: [],
      club: club.code,
      club_name: club.name,
      description,
      id,
      image_url: null,
      is_ics_event: false,
      large_image_url: null,
      name,
      ticketed: false,
      pinned: false,
      type,
      url: null,
      showings: [showing],
      earliest_start_time: showing.start_time,
      latest_end_time: showing.end_time,
    }
  }

  return [
    make(
      -1,
      'Weekly GBM',
      ClubEventType.GBM,
      '<p>Placeholder general body meeting for this week.</p>',
      1,
      18,
      1,
      'Houston Hall 218',
    ),
    make(
      -2,
      'Coffee Chat',
      ClubEventType.SOCIAL,
      '<p>Placeholder coffee chat with members.</p>',
      2,
      16,
      1,
      'Huntsman Hall',
    ),
    make(
      -3,
      'Recruitment Info Session',
      ClubEventType.RECRUITMENT,
      '<p>Placeholder recruitment info session.</p>',
      3,
      19,
      1,
      'Towne 100',
    ),
  ]
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
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [drafts, setDrafts] = useState<StoredDraft[]>([])

  const reload = () => {
    doApiRequest(`/clubs/${club.code}/events/?format=json`)
      .then((resp) => resp.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setEvents(list.length ? list : placeholderEvents(club))
      })
      .catch(() => setEvents(placeholderEvents(club)))
  }

  useEffect(() => {
    reload()
    setDrafts(loadDrafts(club.code))
  }, [club.code])

  const openNew = (recurring = false) => {
    setSeed(emptyDraft(recurring))
    setSeedKey((key) => key + 1)
    setPanelOpen(true)
    setShowExtra(false)
    setCreateMenu(false)
    setDraftsOpen(false)
  }

  const openEvent = (event: ClubEvent, showing?: EventShowing | null) => {
    setSeed(draftFromEvent(event, showing))
    setSeedKey((key) => key + 1)
    setPanelOpen(true)
    setShowExtra(false)
    setDraftsOpen(false)
  }

  const openRange = (start: Date, end: Date) => {
    setSeed({
      ...emptyDraft(),
      start_time: moment(start).toISOString(),
      end_time: moment(end).toISOString(),
    })
    setSeedKey((key) => key + 1)
    setPanelOpen(true)
    setShowExtra(false)
    setDraftsOpen(false)
  }

  const visibleEvents = events.filter((event) =>
    eventMatches(event, query, typeFilter, showPast || view === 'calendar'),
  )

  const save = async (values: EventDraft) => {
    if (values.id != null && values.id < 0) {
      toast.info(
        'Sample events are placeholders. Use New Event to create a real one.',
      )
      return
    }
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
    if (event.id < 0) {
      setEvents((current) => current.filter((item) => item.id !== event.id))
      toast.success('Sample event removed')
      if (seed.id === event.id) {
        openNew()
      }
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
    <Fill>
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
          <FormFill>
            <Layout $panel={panelOpen || draftsOpen}>
              <Column>
            <HeadStack>
            <ColumnHead>
              <PageTitle>Events</PageTitle>
              <CreateWrap>
                <CreateButton type="button" onClick={() => openNew(false)}>
                  + Create Event
                </CreateButton>
                <CreateMore
                  type="button"
                  aria-label="More create options"
                  onClick={() => setCreateMenu((open) => !open)}
                >
                  <Icon
                    name="chevron-down"
                    alt=""
                    size="0.85rem"
                    fitSize
                    noMargin
                  />
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
                  </Menu>
                )}
              </CreateWrap>
            </ColumnHead>
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
                      Type
                      <Select
                        styles={selectCompactStyles}
                        components={selectComponents}
                        menuPortalTarget={selectMenuPortalTarget}
                        menuPosition="fixed"
                        isClearable
                        placeholder="All"
                        value={
                          EVENT_TYPES.find(
                            (type) => String(type.value) === typeFilter,
                          ) ?? null
                        }
                        options={EVENT_TYPES}
                        onChange={(option) =>
                          setTypeFilter(
                            option ? String(option.value) : '',
                          )
                        }
                      />
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
              <div style={{ width: 132 }}>
                <Select
                  aria-label="Calendar range"
                  styles={{
                    ...selectMenuStylesWhite,
                    container: (style) => ({ ...style, width: 132 }),
                  }}
                  components={selectComponents}
                  menuPortalTarget={selectMenuPortalTarget}
                  menuPosition="fixed"
                  isSearchable={false}
                  options={[
                    { value: 'week' as const, label: 'Week' },
                    { value: 'month' as const, label: 'Month' },
                  ]}
                  value={{
                    value: range,
                    label: range === 'week' ? 'Week' : 'Month',
                  }}
                  onChange={(option) => {
                    if (option) {
                      setRange(option.value)
                    }
                  }}
                />
              </div>
            </Toolbar>
            </HeadStack>
            <Widget>
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
                    onCreateRange={openRange}
                  />
                ) : (
                  <MonthCalendar
                    anchor={anchor}
                    setAnchor={setAnchor}
                    events={visibleEvents}
                    onEdit={openEvent}
                  />
                )}
            </Widget>
              </Column>
              {(panelOpen || draftsOpen) && (
                <Column>
                {draftsOpen ? (
                  <>
                    <ColumnHead>
                      <PageTitle>Drafts</PageTitle>
                      <GhostButton
                        type="button"
                        onClick={() => {
                          setDraftsOpen(false)
                          openNew(false)
                        }}
                      >
                        New Event
                      </GhostButton>
                    </ColumnHead>
                    <Widget>
                      <Table
                        variant="sheet"
                        fillParent
                        resizable
                        focusable
                        initialPageSize={50}
                        data={drafts.map((draft) => ({
                          id: draft.storageId,
                          name: draft.name || 'Untitled event',
                          type: draft.recurring ? 'Recurring' : 'Event',
                          start: draft.start_time
                            ? moment(draft.start_time).format('MMM D, h:mma')
                            : '',
                          draft,
                        }))}
                        columns={[
                          { name: 'name', label: 'Name' },
                          { name: 'type', label: 'Type' },
                          { name: 'start', label: 'Start' },
                        ]}
                        searchableColumns={['name', 'type', 'start']}
                        onClick={(row) => {
                          const draft = row.original?.draft as StoredDraft
                          if (!draft) {
                            return
                          }
                          const { storageId: _id, savedAt: _at, ...fields } =
                            draft
                          setSeed({
                            ...emptyDraft(),
                            ...fields,
                            image: null,
                          })
                          setSeedKey((key) => key + 1)
                          setPanelOpen(true)
                          setShowExtra(false)
                          setDraftsOpen(false)
                        }}
                      />
                    </Widget>
                  </>
                ) : (
                <EventPanel
                  showExtra={showExtra}
                  setShowExtra={setShowExtra}
                  onClose={() => setDraftsOpen(true)}
                  onPreview={() => setPreview(true)}
                  onDraft={() => {
                    const { image, ...rest } = formik.values
                    const draft: StoredDraft = {
                      ...rest,
                      storageId: `${Date.now()}`,
                      savedAt: Date.now(),
                    }
                    const next = [draft, ...drafts].slice(0, 20)
                    setDrafts(next)
                    saveDrafts(club.code, next)
                    toast.success('Draft saved in this browser tab')
                  }}
                  onAddShowing={() => addShowing(formik.values)}
                  saving={formik.isSubmitting}
                />
                )}
                </Column>
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
          </FormFill>
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
    </Fill>
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

function snapMinutes(value: number) {
  return Math.round(value / 15) * 15
}

function WeekCalendar({
  anchor,
  setAnchor,
  events,
  draft,
  onEdit,
  onDelete,
  onCreateRange,
}: {
  anchor: Date
  setAnchor: (date: Date) => void
  events: ClubEvent[]
  draft: EventDraft
  onEdit: (event: ClubEvent, showing?: EventShowing | null) => void
  onDelete: (event: ClubEvent) => void
  onCreateRange: (start: Date, end: Date) => void
}) {
  const [hover, setHover] = useState<string | null>(null)
  const [drag, setDrag] = useState<{
    dayIndex: number
    startMin: number
    endMin: number
  } | null>(null)
  const dragRef = useRef(drag)
  dragRef.current = drag
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
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
  const hours = Array.from({ length: DAY_HOURS }, (_, index) => index)

  useEffect(() => {
    if (!drag) {
      return
    }
    const move = (event: MouseEvent) => {
      const current = dragRef.current
      if (!current) {
        return
      }
      const el = colRefs.current[current.dayIndex]
      if (!el) {
        return
      }
      const y =
        event.clientY - el.getBoundingClientRect().top - HOUR_TOP
      const mins = snapMinutes(
        Math.max(0, Math.min(DAY_HOURS * 60, (y / HOUR_PX) * 60)),
      )
      setDrag({ ...current, endMin: mins })
    }
    const up = () => {
      const current = dragRef.current
      setDrag(null)
      if (!current) {
        return
      }
      const from = Math.min(current.startMin, current.endMin)
      const to = Math.max(current.startMin, current.endMin)
      if (to - from < 15) {
        return
      }
      const day = start.clone().add(current.dayIndex, 'days').startOf('day')
      onCreateRange(
        day.clone().add(from, 'minutes').toDate(),
        day.clone().add(Math.max(to, from + 30), 'minutes').toDate(),
      )
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [Boolean(drag)])

  const place = (startTime: string, endTime: string) => {
    const startMoment = moment(startTime)
    const endMoment = moment(endTime)
    const startMinutes = startMoment.hours() * 60 + startMoment.minutes()
    const endMinutes = Math.max(
      endMoment.hours() * 60 + endMoment.minutes(),
      startMinutes + 30,
    )
    const top = Math.max(0, HOUR_TOP + (startMinutes / 60) * HOUR_PX)
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_PX, 28)
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
    <CalendarFill>
      <CalendarHead>
        <NavButton
          type="button"
          aria-label="Previous week"
          onClick={() => setAnchor(start.clone().subtract(1, 'week').toDate())}
        >
          <Icon name="chevron-left" alt="" size="21px" fitSize noMargin />
        </NavButton>
        <NavButton
          type="button"
          aria-label="Next week"
          onClick={() => setAnchor(start.clone().add(1, 'week').toDate())}
        >
          <Icon name="chevron-right" alt="" size="21px" fitSize noMargin />
        </NavButton>
        <MonthLabel>{start.format('MMMM YYYY')}</MonthLabel>
      </CalendarHead>
      <WeekGrid>
        <DayHead />
        {days.map((day) => (
          <DayHead key={day.toISOString()}>
            <div className="day-num">{day.format('D')}</div>
            <div className="day-name">{day.format('ddd').toUpperCase()}</div>
          </DayHead>
        ))}
        <HourGutter>
          {hours.map((hour) => (
            <HourLabel key={hour}>
              {moment().hour(hour).minute(0).format('h A')}
            </HourLabel>
          ))}
        </HourGutter>
        {days.map((day, dayIndex) => (
          <DayCol
            key={day.toISOString()}
            ref={(el) => {
              colRefs.current[dayIndex] = el
            }}
            onMouseDown={(event) => {
              if (event.button !== 0) {
                return
              }
              const y =
                event.clientY -
                event.currentTarget.getBoundingClientRect().top -
                HOUR_TOP
              const startMin = snapMinutes(
                Math.max(0, Math.min(DAY_HOURS * 60, (y / HOUR_PX) * 60)),
              )
              setDrag({ dayIndex, startMin, endMin: startMin + 30 })
            }}
          >
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
                    onMouseDown={(click) => click.stopPropagation()}
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
            {drag && drag.dayIndex === dayIndex && (
              <BlockButton
                $dashed
                style={{
                  top:
                    HOUR_TOP +
                    (Math.min(drag.startMin, drag.endMin) / 60) * HOUR_PX,
                  height: Math.max(
                    (Math.abs(drag.endMin - drag.startMin) / 60) * HOUR_PX,
                    28,
                  ),
                }}
              >
                <strong>New Event</strong>
              </BlockButton>
            )}
          </DayCol>
        ))}
      </WeekGrid>
    </CalendarFill>
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
    <CalendarFill>
      <CalendarHead>
        <NavButton
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setAnchor(moment(anchor).subtract(1, 'month').toDate())
          }
        >
          <Icon name="chevron-left" alt="" size="21px" fitSize noMargin />
        </NavButton>
        <NavButton
          type="button"
          aria-label="Next month"
          onClick={() => setAnchor(moment(anchor).add(1, 'month').toDate())}
        >
          <Icon name="chevron-right" alt="" size="21px" fitSize noMargin />
        </NavButton>
        <MonthLabel>{moment(anchor).format('MMMM YYYY')}</MonthLabel>
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
    </CalendarFill>
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
      <HeadStack>
      <PanelHead>
        <BackButton type="button" aria-label="View drafts" onClick={onClose}>
          <Icon name="chevron-left" alt="" size="1.1rem" fitSize noMargin />
        </BackButton>
        <PageTitle as="h2" style={{ fontSize: 20 }}>
          {values.id ? 'Edit Event' : 'New Event'}
        </PageTitle>
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
      </HeadStack>
      <Widget>
      <PanelBody>
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
      </PanelBody>
      <SaveRow>
        <Primary type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Event'}
        </Primary>
        <Secondary type="button" onClick={onDraft}>
          Save Draft
        </Secondary>
      </SaveRow>
      </Widget>
    </Panel>
  )
}
