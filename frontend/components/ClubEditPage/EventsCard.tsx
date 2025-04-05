import { Field } from 'formik'
import moment from 'moment'
import Link from 'next/link'
import { forwardRef, ReactElement, RefObject, useRef, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { LIGHT_GRAY } from '../../constants'
import { Club, ClubEvent, ClubEventType, EventGroup } from '../../types'
import { stripTags } from '../../utils'
import { FAIR_NAME, OBJECT_EVENT_TYPES } from '../../utils/branding'
import { Device, Icon, Line, Modal, Text } from '../common'
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
import TicketsModal from './TicketsModal'

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

const eventGroupTableFields = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'type',
    label: 'Type',
    converter: (a: ClubEventType): string =>
      (EVENT_TYPES.find((v) => v.value === a) || { label: 'Unknown' }).label,
  },
  {
    name: 'events',
    label: 'Sessions',
    converter: (events: ClubEvent[]): string => `${events.length} session(s)`,
  },
]

const eventTableFields = [
  {
    name: 'start_time',
    label: 'Start Time',
    converter: (a: string): ReactElement<any> => <TimeAgo date={a} />,
  },
  {
    name: 'end_time',
    label: 'End Time',
    converter: (a: string): ReactElement<any> => <TimeAgo date={a} />,
  },
  {
    name: 'location',
    label: 'Location',
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
      <EventModal event={{ event, group: event.group }} />
    </PreviewContainer>
  </EventPreviewContainer>
)

const CreateContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

interface CreateTicketsProps {
  event: ClubEvent
  eventGroup: EventGroup
  club: Club
  groupName?: string
}

const CreateTickets = forwardRef<HTMLDivElement, CreateTicketsProps>(
  ({ event, eventGroup, club, groupName }, ticketDroptimeRef) => {
    const [show, setShow] = useState(false)

    const showModal = () => setShow(true)
    const hideModal = () => setShow(false)

    return (
      <CreateContainer>
        <div className="is-pulled-left">
          <Text style={{ padding: 0, margin: 0 }}>
            {event.ticketed ? 'Add' : 'Create'} ticket offerings for this event
            session.
          </Text>
        </div>
        <div className="is-pulled-right">
          <button
            onClick={showModal}
            disabled={!groupName}
            className="button is-primary"
          >
            Create
          </button>
        </div>
        {show && (
          <Modal
            width="50vw"
            show={show}
            closeModal={hideModal}
            marginBottom={false}
          >
            <TicketsModal
              club={club}
              event={event}
              eventGroup={eventGroup}
              onSuccessfulSubmit={hideModal}
              closeModal={() => {
                hideModal()
                if (ticketDroptimeRef && 'current' in ticketDroptimeRef) {
                  const divRef =
                    ticketDroptimeRef as RefObject<HTMLDivElement | null>
                  ticketDroptimeRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  })
                  divRef.current?.querySelector('input')?.focus()
                }
              }}
            />
          </Modal>
        )}
      </CreateContainer>
    )
  },
)

type EventsCardProps = {
  club: Club
}

export default function EventsCard({
  club,
}: EventsCardProps): ReactElement<any> {
  const [selectedEventGroup, setSelectedEventGroup] =
    useState<EventGroup | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const eventDetailsRef = useRef<HTMLDivElement>(null)
  const ticketDroptimeRef = useRef<HTMLDivElement>(null)

  const eventGroupFields = (
    <>
      <Field
        name="name"
        as={TextField}
        required
        helpText="The name of your event."
      />
      <Field
        name="url"
        as={TextField}
        type="url"
        helpText="The videoconference link for your event."
        label="Meeting Link"
      />
      <Field
        name="image"
        as={FileField}
        isImage
        helpText="The image for your event."
      />
      <Field
        name="type"
        as={SelectField}
        required
        choices={EVENT_TYPES}
        serialize={({ value }) => value}
        isMulti={false}
        valueDeserialize={(val) => EVENT_TYPES.find((x) => x.value === val)}
        helpText="The type of event."
      />
      <Field
        name="description"
        placeholder="Type your event description here!"
        as={RichTextField}
        helpText="The description of your event."
      />
      {!isEditing && (
        <>
          <Field
            name="events[0].start_time"
            required
            placeholder="When does your first session start?"
            as={DateTimeField}
          />
          <Field
            name="events[0].end_time"
            required
            placeholder="When does your first session end?"
            as={DateTimeField}
          />
          <div ref={ticketDroptimeRef} className="mb-3">
            <Field
              name="events[0].ticket_drop_time"
              id="ticket_drop_time"
              placeholder="When should tickets become available?"
              as={DateTimeField}
              helpText="Leave blank if this event doesn't require tickets."
            />
          </div>
          <Field
            name="events[0].location"
            as={TextField}
            placeholder="Event Location"
            helpText="Where will this event take place?"
          />
        </>
      )}
    </>
  )

  const eventFields = (
    <>
      <Field
        name="start_time"
        required
        placeholder="When does this session start?"
        as={DateTimeField}
      />
      <Field
        name="end_time"
        required
        placeholder="When does this session end?"
        as={DateTimeField}
      />
      <div ref={ticketDroptimeRef} className="mb-3">
        <Field
          name="ticket_drop_time"
          id="ticket_drop_time"
          placeholder="When should tickets become available?"
          as={DateTimeField}
          helpText="Leave blank if this session doesn't require tickets."
        />
      </div>
      <Field
        name="location"
        as={TextField}
        placeholder="Session Location"
        helpText="Where will this session take place?"
      />
    </>
  )

  return (
    <BaseCard title="Events">
      <Text>
        {club.approved || club.is_ghost
          ? 'Manage your club events. Past events are hidden by default.'
          : 'Note: you must be an approved club to create publicly-viewable events.'}
      </Text>

      <div className="mb-5">
        <h3 className="title is-4">Your Events</h3>
        <ModelForm
          actions={(object) => (
            <Link legacyBehavior href={{ pathname: `/events/${object.code}` }}>
              <button className="button is-info is-small">
                <Icon name="eye" /> View
              </button>
            </Link>
          )}
          baseUrl={`/clubs/${club.code}/eventgroups/`}
          keyField="code"
          listParams={`&end_time__gte=${new Date().toISOString()}`}
          fields={eventGroupFields}
          fileFields={['image']}
          tableFields={eventGroupTableFields}
          noun="Event"
          currentTitle={(obj) => (obj != null ? obj.name : 'New Event')}
          onEditPressed={() => {
            setIsEditing(true)
            eventDetailsRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }}
          onChange={(obj) => {
            if (obj) {
              setSelectedEventGroup(obj as EventGroup)
              setSelectedEvent(null)
              setIsEditing(true)
            } else {
              setIsEditing(false)
            }
          }}
        />
      </div>

      {selectedEventGroup && isEditing && (
        <div className="mb-5">
          <h3 className="title is-4">Sessions for {selectedEventGroup.name}</h3>
          <Text className="mb-3">
            Add multiple sessions to your event if it occurs at different times
            or locations.
          </Text>
          <ModelForm
            key={selectedEventGroup.code}
            baseUrl={`/eventgroups/${selectedEventGroup.code}/events/`}
            initialData={selectedEventGroup.events || []}
            keyField="id"
            fields={eventFields}
            tableFields={eventTableFields}
            noun="Session"
            currentTitle={(obj) => {
              if (!obj) return 'New Session'
              const start = moment(obj.start_time).format('lll')
              const end = moment(obj.end_time).format('lll')
              return `${start} - ${end}`
            }}
            onEditPressed={() => {
              eventDetailsRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }}
            onChange={(obj) => {
              if (obj) {
                setSelectedEvent({
                  ...obj,
                  group: selectedEventGroup,
                } as ClubEvent)
              }
            }}
          />
        </div>
      )}

      <Line />
      {selectedEvent && selectedEventGroup && (
        <>
          <CreateTickets
            event={selectedEvent}
            eventGroup={selectedEventGroup}
            club={club}
            groupName={selectedEventGroup?.name}
            ref={ticketDroptimeRef}
          />
          <Line />
          <div ref={eventDetailsRef}>
            <EventPreview event={selectedEvent} />
          </div>
        </>
      )}
    </BaseCard>
  )
}
