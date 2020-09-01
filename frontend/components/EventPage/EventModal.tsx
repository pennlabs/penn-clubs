import { useRouter } from 'next/router'
import React, { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Icon, TransparentButton } from '../../components/common'
import { CLUB_ROUTE, CLUBS_BLUE, M2, ZOOM_BLUE } from '../../constants'
import { ClubEvent } from '../../types'
import { doApiRequest } from '../../utils'
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

export const MEETING_REGEX = /^https?:\/\/(?:[\w-]+\.)?zoom\.us\//i

const EventModal = (props: {
  event: ClubEvent
  isHappening: boolean
  showDetailsButton?: boolean
}): ReactElement => {
  const { event, isHappening, showDetailsButton } = props
  const {
    image_url,
    club_name,
    start_time,
    end_time,
    name,
    url,
    description,
  } = event
  const router = useRouter()
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
        image={image_url}
        fallback={<p>{club_name.toLocaleUpperCase()}</p>}
      />
      <EventDetails>
        <MetaDataGrid>
          <DateInterval start={new Date(start_time)} end={new Date(end_time)} />
          <RightAlign>{isHappening && <HappeningNow />}</RightAlign>
        </MetaDataGrid>
        <ClubName>{club_name}</ClubName>
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
            <TransparentButton
              backgroundColor={CLUBS_BLUE}
              onClick={() => router.push(CLUB_ROUTE(), CLUB_ROUTE(event.club))}
            >
              See Club Details{' '}
              <Icon name="chevrons-right" alt="chevrons-right" />
            </TransparentButton>
          </RightAlign>
        )}
      </EventDetails>
    </ModalContainer>
  )
}

export default EventModal
