import { Field } from 'formik'
import moment from 'moment'
import Link from 'next/link'
import { ReactElement, useRef, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { LIGHT_GRAY } from '../../constants'
import { Club, ClubEvent, ClubEventType, EventShowing } from '../../types'
import { stripTags } from '../../utils'
import { FAIR_NAME, OBJECT_EVENT_TYPES } from '../../utils/branding'
import { Device, Icon, Line, Text } from '../common'
import EventModal from '../EventPage/EventModal'
import {
  DateTimeField,
  FileField,
  RichTextField,
  SelectField,
  TextField,
} from '../FormComponents'
import { ModelForm } from '../ModelForm'
import BaseCard from './BaseCard'

const EventBox = styled.div<{ type: 'ios' | 'android' }>`
  text-align: left;
  font-family: 'HelveticaNeue', 'Helvetica';
  user-select: none;
  pointer-events: none;

  background-color: white;
  ${({ type }) =>
    type === 'android'
      ? `
    box-shadow: 1px 1px 3px #ccc;
    border-radius: 5px;
    font-size: 0.9em;
    margin: 5px;
    margin-top: 0px;

    padding: 5px;

    display: flex;
    flex-direction: row;
    font-family: Roboto;
    color: black;

    & .img-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      float: left;
    }

    & .text {
      flex: 1;
      display: flex;
      text-align: center;
      align-items: center;
      justify-content: space-between;
      flex-direction: column;
      font-size: inherit;
      padding-left: 5px;
      padding-right: 5px;
    }

    & .title {
      width: 100%;
      font-weight: bold;
      font-size: inherit;
      align-self: flex-start;
      margin-bottom: 0;
    }

    & .date {
      padding-top: 5px;
      width: 100%;
      align-self: flex-end;
    }

    & .desc {
      width: 100%;
      font-size: inherit;
    }

    & .img-wrapper img {
      width: 100%;
      display: block;
      height: 100px;
      background-color: #eee;
    }
  `
      : `
    margin: 15px;
    box-shadow: 1px 1px 10px #ccc;
    border-radius: 15px;
    font-size: 1.5em;
  
    & .img-wrapper {
      background-color: #eee;
      border-radius: 15px 15px 0 0;
      overflow: hidden;
    }

    & .img-wrapper img {
      border: 1px solid white;
      height: 175px;
      display: block;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      width: 100%;
    }

    & .text {
      padding: 15px;
      padding-top: 5px;
    }

    & .title {
      font-size: 18px;
      word-wrap: break-word;
    }

    & .desc, & .date {
      color: #888;
      font-size: 14px;
    }
  `}

  & .desc, & .date {
    display: block;
    word-wrap: break-word;
  }

  & .date {
    margin-top: 5px;
  }
`

const DevicesWrapper = styled.div`
  margin-top: 1em;
  & .marvel-device {
    margin: 0 auto;
    display: block;
  }
`

const Devices = ({ contents }) => {
  const [deviceType, setDeviceType] = useState('none')

  return (
    <>
      <span className="field has-addons is-pulled-right">
        {['None', 'iOS', 'Android'].map((type) => (
          <p key={type} className="control">
            <button
              onClick={() => setDeviceType(type.toLowerCase())}
              className={`button ${
                deviceType === type.toLowerCase() ? 'is-link' : ''
              }`}
            >
              <span>{type}</span>
            </button>
          </p>
        ))}
      </span>
      <DevicesWrapper className="is-clearfix">
        {deviceType === 'ios' ? (
          <Device style={{ zoom: 0.8 }} type="iphone">
            <DeviceEventPreview type="ios" deviceContents={contents} />
          </Device>
        ) : deviceType === 'android' ? (
          <Device type="android">
            <DeviceEventPreview type="android" deviceContents={contents} />
          </Device>
        ) : null}
      </DevicesWrapper>
    </>
  )
}

const DeviceEventPreview = ({ deviceContents, type }) => {
  const time =
    deviceContents && deviceContents.start_time
      ? moment(deviceContents.start_time)
      : moment()

  const endTime =
    deviceContents && deviceContents.end_time
      ? moment(deviceContents.end_time)
      : moment().add(moment.duration({ hours: 1, minutes: 20 }))

  const img = deviceContents.image && deviceContents.image.get('image')

  return (
    <div
      style={{
        backgroundColor: type === 'android' ? '#fafafa' : 'white',
        height: '100%',
      }}
    >
      <img
        src={`/static/img/phone_header_${type}.png`}
        style={{ width: '100%' }}
      />
      <EventBox className="is-clearfix" type={type}>
        <div className="img-wrapper">
          <img
            src={
              img instanceof File
                ? URL.createObjectURL(img)
                : (deviceContents._original &&
                    deviceContents._original.image_url) ||
                  deviceContents.image_url ||
                  null
            }
          />
        </div>
        <div className="text">
          <b className="title">{deviceContents.name || 'Your Title'}</b>
          <span className="desc">
            {deviceContents.description
              ? stripTags(deviceContents.description) || 'Your Description'
              : 'Your Description'}
          </span>
          <span className="date">
            {type === 'android' ? (
              <>
                {time.format('h:mm A')} - {endTime.format('h:mm A')}
              </>
            ) : (
              <>Today at {time.format('h:mma')}</>
            )}
          </span>
        </div>
      </EventBox>
    </div>
  )
}

type EventsCardProps = {
  club: Club
}

export const EVENT_TYPES = [
  {
    value: ClubEventType.RECRUITMENT,
    label: 'Recruitment',
  },
  {
    value: ClubEventType.GBM,
    label: 'General Body Meeting (GBM)',
  },
  {
    value: ClubEventType.SOCIAL,
    label: 'Social',
  },
  {
    value: ClubEventType.CAREER,
    label: 'Career',
  },
  {
    value: ClubEventType.SPEAKER,
    label: 'Speaker Event',
  },
  {
    value: ClubEventType.FAIR,
    label: `${FAIR_NAME} Fair`,
  },
  {
    value: ClubEventType.OTHER,
    label: 'Other',
  },
].filter(({ value }) => OBJECT_EVENT_TYPES.has(value))

const eventTableFields = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'earliest_start_time',
    label: 'Start Time',
    converter: (a: string): ReactElement<any> => <TimeAgo date={a} />,
  },
  {
    name: 'type',
    label: 'Type',
    converter: (a: ClubEventType): string =>
      (EVENT_TYPES.find((v) => v.value === a) || { label: 'Unknown' }).label,
  },
  {
    name: 'is_ics_event',
    label: 'ICS',
    converter: (a: boolean): ReactElement<any> => {
      return a ? (
        <span className="has-text-success">
          <Icon name="check" />
        </span>
      ) : (
        <span className="has-text-danger">
          <Icon name="x" />
        </span>
      )
    },
  },
  {
    name: 'showings',
    label: 'Dates',
    converter: (showings: EventShowing[] | undefined): string =>
      `${showings?.length ?? 0} date(s)`,
  },
]

const showingTableFields = [
  {
    name: 'start_time',
    label: 'Start Time',
    converter: (a: string): ReactElement<any> => (
      <>{moment(a).format('MMM D, h:mma')}</>
    ),
  },
  {
    name: 'end_time',
    label: 'End Time',
    converter: (a: string): ReactElement<any> => (
      <>{moment(a).format('MMM D, h:mma')}</>
    ),
  },
  {
    name: 'location',
    label: 'Location',
  },
  {
    name: 'ticket_drop_time',
    label: 'Ticket Drop',
    converter: (a?: string | null): ReactElement | string =>
      a ? <>{moment(a).format('MMM D, h:mma')}</> : 'N/A',
  },
  {
    name: 'ticket_order_limit',
    label: 'Order Limit',
  },
]

const EventPreviewContainer = styled.div`
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
`

const EventPreviewDescriptionContainer = styled.div`
  display: grid;
  margin: auto 0;
  width: 40%;
`
const PreviewContainer = styled.div`
  margin-top: 2rem;
  max-width: 40%;
  box-shadow: 2px 2px 10px ${LIGHT_GRAY};
  padding-bottom: 1em;
  border-radius: 3px;
`
const EventPreview = ({ event }: { event: ClubEvent }) => (
  <EventPreviewContainer>
    <EventPreviewDescriptionContainer>
      <h3 className="subtitle">Event Preview</h3>
      <p>This is how your event will appear to students on the event page.</p>
      {event.is_ics_event && (
        <p className="mt-3">
          This event was automatically imported from your ICS calendar. Any
          changes you make to this event may be overwritten if you update your
          calendar.
        </p>
      )}
    </EventPreviewDescriptionContainer>
    <PreviewContainer>
      <EventModal
        event={event}
        start_time={event.earliest_start_time || ''}
        end_time={event.latest_end_time || ''}
      />
    </PreviewContainer>
    {/* TODO: uncomment device preview when we have mobile integration. */}
    {/* <Devices contents={event} /> */}
  </EventPreviewContainer>
)

export default function EventsCard({
  club,
}: EventsCardProps): ReactElement<any> {
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null)
  const [formObject, setFormObject] = useState<
    Partial<ClubEvent> & { image?: File | string | null }
  >({})

  const [isEditing, setIsEditing] = useState<boolean>(false)

  const eventDetailsRef = useRef<HTMLDivElement>(null)

  const [isRecurring, setIsRecurring] = useState<boolean>(false)

  const eventFields = (
    <>
      <Field
        name="name"
        as={TextField}
        required
        helpText="Provide a descriptive name for the planned event."
      />
      <Field
        name="url"
        as={TextField}
        type="url"
        helpText="Provide a videoconference link to join the event (Zoom, Google Meet, etc)."
        label="Meeting Link"
      />
      <Field name="image" as={FileField} isImage />
      <Field
        name="type"
        as={SelectField}
        required
        choices={EVENT_TYPES}
        serialize={({ value }) => value}
        isMulti={false}
        valueDeserialize={(val) => EVENT_TYPES.find((x) => x.value === val)}
      />
      <Field
        name="description"
        placeholder="Type your event description here!"
        as={RichTextField}
      />
      {!isEditing && (
        <>
          <hr />
          <p className="mb-3 has-text-weight-bold">
            Add details for the date of your event (your first date if multiple
            dates are planned at non-recurring times):
          </p>
          <Field
            name="start_time"
            required
            label="Date Start Time"
            placeholder="When does the first date start?"
            as={DateTimeField}
          />
          <Field
            name="end_time"
            required
            label="Date End Time"
            placeholder="When does the first date end?"
            as={DateTimeField}
          />
          <Field
            name="location"
            label="Date Location"
            as={TextField}
            placeholder="Where will this date take place?"
          />
          <button
            className="button is-small is-block mb-2 is-pulled-right"
            onClick={() => setIsRecurring(!isRecurring)}
          >
            Make {isRecurring ? 'non-' : ''}recurring
          </button>
          {isRecurring && (
            <>
              <hr />
              <p className="mb-3 has-text-weight-bold">
                Add details for the recurring dates of your event:
              </p>
              <Field
                name="offset"
                label="Offset"
                as={TextField}
                type="number"
                step={1}
                required
                placeholder="How many days apart are the dates?"
              />
              <Field
                name="end_date"
                label="End Date"
                as={DateTimeField}
                required
                placeholder="When would you like the recurring dates to end?"
              />
            </>
          )}
        </>
      )}
    </>
  )

  // Fields for the Event Showing form
  const showingFields = (
    <>
      <Field
        name="start_time"
        required
        placeholder="Date Start Time"
        as={DateTimeField}
      />
      <Field
        name="end_time"
        required
        placeholder="Date End Time"
        as={DateTimeField}
      />
      <Field
        name="location"
        as={TextField}
        placeholder="Date Location (Optional)"
      />
      <Field
        name="ticket_drop_time"
        id="ticket_drop_time"
        placeholder="Ticket Drop Time (Optional)"
        as={DateTimeField}
        helpText="When tickets first become available. Leave blank if not ticketed or drop immediately."
      />
      <Field
        name="ticket_order_limit"
        label="Ticket Order Limit"
        type="number"
        min="1"
        as={TextField}
        helpText="Maximum tickets one user can get per order. Defaults to unlimited."
      />
    </>
  )

  // Combine formObject (current form state) and selectedEvent for preview
  // Prioritize formObject values if they exist
  const eventPreviewObject = selectedEvent
    ? {
        // Base with selected event data
        ...(selectedEvent as ClubEvent),
        // Overlay with current form state
        ...formObject,
        club_name: club.name, // Add club name for preview
        // Handle image preview: use File object from form if present, else use existing URL
        image_url:
          formObject.image && formObject.image instanceof File
            ? URL.createObjectURL(formObject.image as File)
            : (formObject.image_url ?? selectedEvent.image_url), // Use formObject URL first if available
      }
    : ({ club_name: club.name, ...formObject } as Partial<ClubEvent>)

  return (
    <BaseCard title="Events">
      <Text>
        {club.approved || club.is_ghost
          ? 'Manage events for this club. Events that have already passed are hidden by default.'
          : 'Note: you must be an approved club to create publicly-viewable events.'}
      </Text>
      <ModelForm
        actions={(object) => (
          <Link legacyBehavior href={{ pathname: `/events/${object.id}` }}>
            <button className="button is-info is-small">
              <Icon name="eye" /> Page
            </button>
          </Link>
        )}
        baseUrl={`/clubs/${club.code}/events/`}
        keyField="id"
        fields={eventFields}
        fileFields={['image']}
        tableFields={eventTableFields}
        noun="Event"
        currentTitle={(obj) => obj?.name ?? 'New Event'}
        onEditPressed={() => {
          setIsEditing(true)
          eventDetailsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }}
        onChange={(obj) => {
          const eventObject = obj as ClubEvent | null
          if (eventObject && eventObject.id) {
            setSelectedEvent(eventObject)
            setIsEditing(true)
          } else {
            setSelectedEvent(null)
            setIsEditing(false)
          }
          setFormObject(
            (eventObject ?? {}) as Partial<ClubEvent> & {
              image?: File | string | null
            },
          )
        }}
      />
      {selectedEvent && (
        <div className="mt-5">
          <h3 className="title is-4">Dates for {selectedEvent.name}</h3>
          <Text className="mb-3">
            Add or manage specific dates, times, and locations for this event.
          </Text>
          <ModelForm
            key={selectedEvent.id}
            baseUrl={`/events/${selectedEvent.id}/showings/`}
            initialData={selectedEvent.showings || []}
            keyField="id"
            fields={showingFields}
            tableFields={showingTableFields}
            allowDeletion={false}
            noun="Date"
            currentTitle={(obj) => {
              if (!obj) return 'New Date'
              const showing = obj as EventShowing
              const start = moment(showing.start_time).format('MMM D, h:mma')
              const end = moment(showing.end_time).format('h:mma')
              return `${start} - ${end} ${showing.location ? `(${showing.location})` : ''}`
            }}
            onEditPressed={() => {
              eventDetailsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }}
            actions={(showing: EventShowing) => (
              <Link
                href={`/events/${selectedEvent.id}/tickets/${showing.id}/action=create`}
                target="_blank"
              >
                <button className="button is-small is-primary">
                  <Icon name="credit-card" />{' '}
                  {showing.ticketed ? 'Manage Tickets' : 'Add Tickets'}
                </button>
              </Link>
            )}
            onUpdate={(updatedShowings) => {
              setSelectedEvent((prev) =>
                prev
                  ? { ...prev, showings: updatedShowings as EventShowing[] }
                  : null,
              )
            }}
          />
        </div>
      )}

      {(selectedEvent || Object.keys(formObject).length > 0) && (
        <div ref={eventDetailsRef} className="mt-4">
          <Line />
          <EventPreview event={eventPreviewObject as ClubEvent} />
        </div>
      )}
    </BaseCard>
  )
}
