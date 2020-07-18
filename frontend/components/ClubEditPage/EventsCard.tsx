import moment from 'moment'
import { ReactElement, useState } from 'react'
import TimeAgo from 'react-timeago'
import s from 'styled-components'

import { Club } from '../../types'
import { stripTags } from '../../utils'
import { Device, Text } from '../common'
import { ModelForm } from '../Form'
import BaseCard from './BaseCard'

const EventBox = s.div<{ type: 'ios' | 'android' }>`
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

const DevicesWrapper = s.div`
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

const types = [
  {
    value: 1,
    label: 'Recruitment',
  },
]

const eventTableFields = [
  {
    name: 'name',
    label: 'Name',
  },
  {
    name: 'start_time',
    label: 'Start Time',
    converter: (a) => <TimeAgo date={a} />,
  },
  {
    name: 'type',
    label: 'Type',
    converter: (a) =>
      (types.find((v) => v.value === a) || { label: 'Unknown' }).label,
  },
]

const eventFields = [
  {
    name: 'name',
    type: 'text',
    required: true,
    help: 'Provide a descriptive name for the planned event.',
  },
  {
    name: 'location',
    placeholder: 'Provide the event location',
    type: 'text',
  },
  {
    name: 'url',
    type: 'url',
  },
  {
    name: 'image',
    type: 'file',
  },
  {
    name: 'start_time',
    required: true,
    placeholder: 'Provide a start time for the event',
    type: 'datetime-local',
  },
  {
    name: 'end_time',
    required: true,
    placeholder: 'Provide an end time for the event',
    type: 'datetime-local',
  },
  {
    name: 'type',
    type: 'select',
    required: true,
    choices: types,
    converter: (a) => types.find((x) => x.value === a),
    reverser: (a) => a.value,
  },
  {
    name: 'description',
    placeholder: 'Type your event description here!',
    type: 'html',
  },
]

export default function EventsCard({ club }: EventsCardProps): ReactElement {
  const [deviceContents, setDeviceContents] = useState({})

  return (
    <BaseCard title="Events">
      <Text>Manage events for this club.</Text>
      <ModelForm
        baseUrl={`/clubs/${club.code}/events/`}
        fields={eventFields}
        tableFields={eventTableFields}
        noun="Event"
        currentTitle={(obj) => obj.name}
        onChange={(obj) => setDeviceContents(obj)}
      />
      <Devices contents={deviceContents} />
    </BaseCard>
  )
}
