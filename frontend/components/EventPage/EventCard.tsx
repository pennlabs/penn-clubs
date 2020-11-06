import Link from 'next/link'
import { ReactElement, useState } from 'react'
import LazyLoad from 'react-lazy-load'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon, TransparentButtonLink } from '../../components/common'
import { CLUB_ROUTE, CLUBS_BLUE, M2, ZOOM_BLUE } from '../../constants'
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

const RightAlign = styled.div`
  & > * {
    margin-top: 10px;
    float: right;
  }
`
const MEETING_REGEX = /^https?:\/\/(?:[\w-]+\.)?zoom\.us\//i

const clipLink = (s: string) => (s.length > 32 ? `${s.slice(0, 35)}...` : s)

const EventCard = (props: { event: ClubEvent }): ReactElement => {
  const {
    image_url: imageUrl,
    club_name: clubName,
    start_time,
    end_time,
    name,
    url,
  } = props.event
  const [modalVisible, setModalVisible] = useState(false)

  const showModal = () => setModalVisible(true)
  const hideModal = () => setModalVisible(false)

  const now = new Date()
  const startDate = new Date(start_time)
  const endDate = new Date(end_time)
  const isHappening = now >= startDate && now <= endDate

  const hoursBetween =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  return (
    <>
      <EventCardContainer className="event">
        <Card bordered background={WHITE} style={{ display: 'inline-block' }}>
          <LazyLoad offset={800}>
            <CoverPhoto
              image={imageUrl}
              fallback={
                <p>
                  <b>{clubName.toLocaleUpperCase()}</b>
                </p>
              }
            />
          </LazyLoad>
          <DateInterval start={startDate} end={endDate} />
          {isHappening ? (
            <HappeningNow urgent={true} />
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
              <EventLink href={url}>{clipLink(url)}</EventLink>
            ))}
          <RightAlign>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)} passHref>
              <TransparentButtonLink
                backgroundColor={CLUBS_BLUE}
                onClick={(e) => {
                  if (!event.club) {
                    e.preventDefault()
                  }
                }}
              >
                See Club Details{' '}
                <Icon name="chevrons-right" alt="chevrons-right" />
              </TransparentButtonLink>
            </Link>
          </RightAlign>
        </Card>
      </EventCardContainer>
    </>
  )
}

export default EventCard
