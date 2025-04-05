import Color from 'color'
import React, { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon, Text } from '../../components/common'
import { ZOOM_BLUE } from '../../constants'
import { MEDIUM_GRAY } from '../../constants/colors'
import { ClubEvent } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import HappeningNow from './HappeningNow'

const ModalContainer = styled.div`
  text-align: left;
`

const EventDetails = styled.div`
  padding: 20px;
`

const Description = ({
  contents,
  className,
}: {
  contents: string
  className?: string
}) => (
  <div
    className={className}
    dangerouslySetInnerHTML={{
      __html: contents || '',
    }}
  />
)

const StyledDescription = styled(Description)`
  margin-top: 5px;
  margin-bottom: 15px;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;

  & > p {
    word-wrap: break-word;
  }
`
const RightAlign = styled.div`
  & > * {
    float: right;
  }
`

const MetaDataGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
`
const TimeLeft = styled(TimeAgo)<{ date: Date }>`
  color: ${MEDIUM_GRAY};
  font-size: 12px;
`

const ZoomButton = styled.a`
  background-color: ${ZOOM_BLUE};
  border-color: transparent;
  color: #fff;

  &:hover {
    background-color: ${Color(ZOOM_BLUE).darken(0.1).toString()};
    border-color: transparent;
    color: #fff;
  }
`

export const MEETING_REGEX = /^https?:\/\/(?:[\w-]+\.)?zoom\.us\//i

/**
 * Convert seconds into an approximate human friendly format.
 */
const formatDuration = (time: number): string => {
  if (time >= 3600) {
    const hours = Math.round(time / 3600)
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  if (time >= 60) {
    const minutes = Math.round(time / 60)
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  const secs = Math.round(time)
  return `${secs} second${secs === 1 ? '' : 's'}`
}

/**
 * Given an event ID, listen using a websocket connection for updates to this event.
 */
const LiveEventUpdater = ({
  id,
  onUpdate,
}: {
  id: number
  onUpdate: () => void
}): null => {
  useEffect(() => {
    const wsUrl = `${location.protocol === 'http:' ? 'ws' : 'wss'}://${
      location.host
    }/api/ws/event/${id}/`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = () => {
      onUpdate()
    }
    return () => ws.close()
  }, [id])

  return null
}

type LiveStatsData = {
  attending: number
  attended: number
  officers: number
  time: number
}

/**
 * A small widget that shows the live statistics for the current event.
 * Hides the statistics if no one is attending or attended the meeting.
 */
export const LiveStats = ({
  stats,
}: {
  stats: LiveStatsData
}): ReactElement<any> | null => {
  if (stats.attending - stats.officers + stats.attended <= 8) {
    return null
  }

  return (
    <div className="mb-3">
      <span className="has-text-info mr-2">
        <Icon name="user" /> {stats.attending} attendees
      </span>
      <span className="has-text-link mr-2">
        <Icon name="user" /> {stats.officers} {OBJECT_NAME_SINGULAR} members
      </span>
      <span className="has-text-grey mr-2">
        <Icon name="user" /> {stats.attended} attended
      </span>
      {stats.time >= 60 && (
        <span className="has-text-primary mr-2">
          <Icon name="clock" /> {formatDuration(stats.time)}
        </span>
      )}
    </div>
  )
}

const EventModal = (props: {
  event: ClubEvent
  onLinkClicked?: () => void
}): ReactElement<any> => {
  const { event, onLinkClicked } = props
  const {
    large_image_url,
    image_url,
    club_name,
    start_time,
    end_time,
    ticketed,
    name,
    url,
    description,
    id,
  } = event
  const [userCount, setUserCount] = useState<LiveStatsData | null>(null)
  const [tickets, setTickets] = useState<Record<
    string,
    { total: number; available: number; price: number }
  > | null>(null)
  const [userHasTickets, setUserHasTickets] = useState<boolean | null>(null)
  const now = new Date()
  const startDate = new Date(start_time)
  const endDate = new Date(end_time)
  const isHappening = now >= startDate && now <= endDate
  const isZoomMeeting = url && MEETING_REGEX.test(url)

  const refreshLiveData = () => {
    if (isZoomMeeting) {
      doApiRequest(`/webhook/meeting/?format=json&event=${event.id}`)
        .then((resp) => resp.json())
        .then((resp) => {
          setUserCount(resp)
        })
    }
    if (ticketed) {
      doApiRequest(`/events/${event.id}/tickets/`)
        .then((resp) => resp.json())
        .then((resp) => {
          const ticketMap = resp.totals.reduce(
            (acc, cur) => ({
              ...acc,
              [cur.type]: {
                total: cur.count,
                available:
                  resp.available.find((t) => t.type === cur.type)?.count ?? 0,
                price: cur.price,
              },
            }),
            {},
          ) as Record<
            string,
            { total: number; available: number; price: number }
          >
          setTickets(ticketMap)
        })
      setUserHasTickets(false)
      doApiRequest(`/tickets/`)
        .then((resp) => resp.json())
        .then((resp) => {
          for (let i = 0; i < resp.length; i++) {
            if (resp[i].event.id === event.id) {
              setUserHasTickets(true)
              break
            }
          }
        })
    }
  }

  useEffect(refreshLiveData, [])

  return (
    <ModalContainer>
      <CoverPhoto
        image={large_image_url ?? image_url}
        fallback={
          <p>{club_name != null ? club_name.toLocaleUpperCase() : 'Event'}</p>
        }
      />
      <EventDetails>
        {isZoomMeeting && (
          <LiveEventUpdater id={event.id} onUpdate={refreshLiveData} />
        )}
        <MetaDataGrid>
          <DateInterval start={new Date(start_time)} end={new Date(end_time)} />
          <RightAlign>
            {isHappening ? (
              <HappeningNow urgent={true} />
            ) : (
              <TimeLeft date={new Date(start_time)} />
            )}
          </RightAlign>
        </MetaDataGrid>
        {club_name != null && <ClubName>{club_name}</ClubName>}
        <EventName>{name}</EventName>
        {url &&
          (MEETING_REGEX.test(url) ? (
            <ZoomButton
              className="button is-small mt-3 mb-2"
              href={url}
              target="_blank"
              onClick={onLinkClicked}
            >
              <Icon name="video" /> Join Meeting
            </ZoomButton>
          ) : /^\(.*\)$/.test(url) ? (
            url
          ) : (
            <EventLink onClick={onLinkClicked} href={url}>
              {url}
            </EventLink>
          ))}{' '}
        {userCount != null && <LiveStats stats={userCount} />}
        <StyledDescription contents={description} />
        {tickets &&
          Object.entries(tickets).map(([type, counts]) => (
            <Text key={type}>
              {type}: {counts.available} tickets available / {counts.total}{' '}
              total
            </Text>
          ))}
        <div className="is-clearfix">
          <div className="buttons is-pulled-right">
            {userHasTickets && (
              <a className="button is-secondary" href="/settings/#Tickets">
                Owned Tickets
              </a>
            )}
            <a className="button is-primary" href={`/events/${id}`}>
              Event Page
            </a>
          </div>
        </div>
      </EventDetails>
    </ModalContainer>
  )
}

export default EventModal
