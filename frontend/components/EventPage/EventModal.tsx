import Color from 'color'
import Link from 'next/link'
import React, { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon } from '../../components/common'
import { CLUB_ROUTE, ZOOM_BLUE } from '../../constants'
import { MEDIUM_GRAY } from '../../constants/colors'
import { ClubEvent } from '../../types'
import { doApiRequest } from '../../utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
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

/**
 * Buttons that allow you to bookmark and subscribe to a club.
 */
const ActionButtons = ({
  club: code,
  isTicketEvent,
  setDisplayTicketModal,
  ticketCount,
  userHasTickets,
}): ReactElement | null => {
  return (
    <>
      {isTicketEvent && (
        <>
          <Link href="/">
            <button
              disabled={ticketCount === 0}
              className="button is-success is-small"
            >
              {ticketCount === 0 && !userHasTickets
                ? ' SOLD OUT'
                : userHasTickets
                ? ' View Tickets'
                : ' Get Tickets'}{' '}
              <Icon name="credit-card" className="ml-2" />
            </button>
          </Link>
        </>
      )}
    </>
  )
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
}): ReactElement | null => {
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
  showDetailsButton?: boolean
  onLinkClicked?: () => void
}): ReactElement => {
  const { event, showDetailsButton, onLinkClicked } = props
  const {
    large_image_url,
    image_url,
    club,
    club_name,
    start_time,
    end_time,
    // ticketed,
    name,
    url,
    description,
  } = event
  const ticketed = true
  const [userCount, setUserCount] = useState<LiveStatsData | null>(null)
  const [ticketCount, setTicketCount] = useState<number | null>(null)
  const [userHasTickets, setUserHasTickets] = useState<boolean | null>(null)
  const [displayTicketModal, setDisplayTicketModal] = useState<boolean>(false)
  const [availableTickets, setAvailableTickets] = useState<Array<JSON> | null>(
    null,
  )

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
    // TODO: CHANGE TO event.ticketed instead of true when that is added
    if (ticketed) {
      setTicketCount(0) // TODO: CHANGE BACK TO 0
      doApiRequest(`/events/${event.id}/tickets/`)
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp.available) {
            setAvailableTickets(resp.available)
            for (let i = 0; i < resp.available.length; i++) {
              setTicketCount(ticketCount + resp.available[i].count)
            }
          }
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

  return !displayTicketModal ? (
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
        {showDetailsButton !== false && event.club != null && (
          <div className="is-clearfix">
            <div className="buttons is-pulled-right">
              {club != null && (
                <ActionButtons
                  club={club}
                  isTicketEvent={ticketed}
                  setDisplayTicketModal={setDisplayTicketModal}
                  ticketCount={ticketCount}
                  userHasTickets={userHasTickets}
                />
              )}
              <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)}>
                <a
                  className="button is-link is-small"
                  onClick={(e) => {
                    if (!event.club) {
                      e.preventDefault()
                    }
                  }}
                >
                  See {OBJECT_NAME_TITLE_SINGULAR} Details{' '}
                  <Icon name="chevrons-right" className="ml-2" />
                </a>
              </Link>
            </div>
          </div>
        )}
      </EventDetails>
    </ModalContainer>
  ) : (
    // TODO: THIS IS NOTHING RN, SHOULD DISPLAY ALL AVAILABLE TICKETS
    <ModalContainer>""</ModalContainer>
  )
}

export default EventModal
