import { ReactElement } from 'react'
import LazyLoad from 'react-lazy-load'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon } from '../../components/common'
import { MEDIUM_GRAY, WHITE } from '../../constants/colors'
import {
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
} from '../../constants/measurements'
import { ClubEvent } from '../../types'
import { Card } from '../common/Card'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import { MEETING_REGEX } from './EventModal'
import HappeningNow from './HappeningNow'

const EventCardContainer = styled.div`
  cursor: pointer;

  ${mediaMinWidth(PHONE)} {
    max-width: 18em;
    margin: 1rem;
  }
  ${mediaMaxWidth(PHONE)} {
    margin: 1rem 0;
  }
`
const TimeLeft = styled(TimeAgo)<{ date: Date }>`
  color: ${MEDIUM_GRAY};
  font-size: 12px;
`
const clipLink = (s: string) => (s.length > 32 ? `${s.slice(0, 35)}...` : s)

const EventCard = (props: {
  event: ClubEvent
  onClick: () => void
  onLinkClicked: () => void
}): ReactElement => {
  const {
    image_url: imageUrl,
    club_name: clubName,
    start_time,
    end_time,
    name,
    url,
    club,
    pinned,
    badges,
  } = props.event

  const now = new Date()
  const startDate = new Date(start_time)
  const endDate = new Date(end_time)
  const isHappening = now >= startDate && now <= endDate

  const hoursBetween =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  return (
    <EventCardContainer className="event">
      <Card $bordered $hoverable background={WHITE} onClick={props.onClick}>
        <LazyLoad offset={800}>
          <CoverPhoto
            image={imageUrl}
            fallback={
              <p>
                <b>
                  {clubName != null ? clubName.toLocaleUpperCase() : 'Event'}
                </b>
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
        {url && MEETING_REGEX.test(url) && <Icon name="video" />}{' '}
        {url &&
          (/^\(.*\)$/.test(url) ? (
            url
          ) : (
            <EventLink onClick={props.onLinkClicked} href={url}>
              {clipLink(url)}
            </EventLink>
          ))}
        {(badges.length > 0 || pinned) && (
          <div className="tags mt-2">
            {pinned && (
              <span className="tag is-primary">
                <Icon name="map-pin" className="mr-1" /> Pinned
              </span>
            )}
            {badges.map(({ id, label }) => (
              <span key={id} className="tag is-info">
                {label}
              </span>
            ))}
          </div>
        )}
      </Card>
    </EventCardContainer>
  )
}

export default EventCard
