import Link from 'next/link'
import React, { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { Icon, TransparentButtonLink } from '../../components/common'
import { CLUB_ROUTE, M2, ZOOM_BLUE } from '../../constants'
import { ADD_BUTTON, MEDIUM_GRAY } from '../../constants/colors'
import { ClubEvent } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_TITLE_SINGULAR } from '../../utils/branding'
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
  font-size: ${M2};
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

export const MEETING_REGEX = /^https?:\/\/(?:[\w-]+\.)?zoom\.us\//i

const EventModal = (props: {
  event: ClubEvent
  isHappening: boolean
  showDetailsButton?: boolean
}): ReactElement => {
  const { event, isHappening, showDetailsButton } = props
  const {
    large_image_url,
    image_url,
    club_name,
    start_time,
    end_time,
    name,
    url,
    description,
  } = event
  const [userCount, setUserCount] = useState<number>(0)

  useEffect(() => {
    if (url && MEETING_REGEX.test(url)) {
      const match = url.match(/\/(\d+)/)
      if (match) {
        const id = match[1]
        doApiRequest(`/webhook/meeting/?format=json&event=${id}`)
          .then((resp) => resp.json())
          .then((resp) => {
            setUserCount(resp.count)
          })
      }
    }
  }, [])

  return (
    <ModalContainer>
      <CoverPhoto
        image={large_image_url ?? image_url}
        fallback={
          <p>{club_name != null ? club_name.toLocaleUpperCase() : 'Event'}</p>
        }
      />
      <EventDetails>
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
            <a
              className="button is-info is-small mt-3 mb-2"
              style={{ backgroundColor: ZOOM_BLUE }}
              href={url}
              target="_blank"
            >
              <Icon name="video" /> Join Meeting
            </a>
          ) : /^\(.*\)$/.test(url) ? (
            url
          ) : (
            <EventLink href={url}>{url}</EventLink>
          ))}{' '}
        {userCount > 0 && (
          <span className="mt-3 ml-2 is-inline-block has-text-info">
            <Icon name="user" /> {userCount} attendees
          </span>
        )}
        <StyledDescription contents={description} />
        {showDetailsButton !== false && (
          <RightAlign>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)} passHref>
              <TransparentButtonLink
                backgroundColor={ADD_BUTTON}
                onClick={(e) => {
                  if (!event.club) {
                    e.preventDefault()
                  }
                }}
              >
                See {OBJECT_NAME_TITLE_SINGULAR} Details{' '}
                <Icon name="chevrons-right" alt="chevrons-right" />
              </TransparentButtonLink>
            </Link>
          </RightAlign>
        )}
      </EventDetails>
    </ModalContainer>
  )
}

export default EventModal
