import { ReactElement } from 'react'
import LazyLoad from 'react-lazy-load'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon } from '../../components/common'
import {
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  MEDIUM_GRAY,
  WHITE,
} from '../../constants/colors'
import { ClubEvent } from '../../types'
import { Card } from '../common/Card'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import { MEETING_REGEX } from './EventModal'
import HappeningNow from './HappeningNow'

const TimeLeft = styled(TimeAgo)<{ date: Date }>`
  color: ${MEDIUM_GRAY};
  font-size: 12px;
`
const TicketsPill = styled.div`
  display: inline-flex;
  background-color: ${CLUBS_LIGHT_BLUE};
  border-radius: 20px;
  font-size: 12px;
  padding: 4px 12px;
  align-items: center;
  justify-content: center;
  color: ${CLUBS_BLUE};

  & > span {
    margin-right: 4px;
  }
`

const clipLink = (s: string) => (s.length > 32 ? `${s.slice(0, 35)}...` : s)

const EventCard = (props: { event: ClubEvent }): ReactElement => {
  const {
    image_url: imageUrl,
    club_name: clubName,
    start_time,
    end_time,
    name,
    url,
    ticketed,
  } = props.event

  const now = new Date()
  const startDate = new Date(start_time)
  const endDate = new Date(end_time)
  const isHappening = now >= startDate && now <= endDate
  const hoursBetween =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  return (
    <Card $bordered $hoverable $background={WHITE}>
      <LazyLoad offset={800}>
        <CoverPhoto
          image={imageUrl}
          fallback={
            <p>
              <b>{clubName != null ? clubName.toLocaleUpperCase() : 'Event'}</b>
            </p>
          }
        />
      </LazyLoad>
      <DateInterval start={startDate} end={endDate} />
      {isHappening ? (
        <HappeningNow urgent={hoursBetween <= 8} />
      ) : (
        <TimeLeft date={new Date(startDate)} />
      )}
      <ClubName>{clubName}</ClubName>
      <EventName>{name}</EventName>
      {ticketed && (
        <TicketsPill
          style={{
            marginTop: '0.5rem',
          }}
        >
          <Icon name="ticket" />
          Tickets
        </TicketsPill>
      )}
      {url && MEETING_REGEX.test(url) && <Icon name="video" />}{' '}
      {url &&
        (/^\(.*\)$/.test(url) ? (
          url
        ) : (
          <EventLink href={url}>{clipLink(url)}</EventLink>
        ))}
    </Card>
  )
}

export default EventCard
