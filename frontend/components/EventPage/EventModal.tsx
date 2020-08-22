import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { Icon, TransparentButton } from '../../components/common'
import { CLUB_ROUTE } from '../../constants'
import { CLUBS_BLUE, WHITE } from '../../constants/colors'
import { M2 } from '../../constants/measurements'
import { ClubEvent } from '../../types'
import { Card } from '../common/Card'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import HappeningNowStyled from './HappeningNow'

const ModalContainer = styled.div`
  text-align: left;
`

const EventDetails = styled.div`
  padding: 20px;
`

const Description = ({
  html,
  className,
}: {
  html: string
  className: string
}) => (
  <div
    className={className}
    style={{ whiteSpace: 'pre-wrap' }}
    dangerouslySetInnerHTML={{
      __html: html || '',
    }}
  />
)

const StyledDescription = styled(Description)`
  font-size: ${M2};
  margin-top: 5px;
  margin-bottom: 15px;
  max-height: 150px;
  overflow-y: auto;

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
  grid-gap: auto;
  grid-template-columns: 2fr 1fr;
`

const EventModal = (props: {
  event: ClubEvent
  isHappening: boolean
}): ReactElement => {
  const { event, isHappening } = props
  const router = useRouter()

  return (
    <ModalContainer>
      <CoverPhoto
        image={event.image_url}
        fallback={<p>{event.club_name.toLocaleUpperCase()}</p>}
      />
      <EventDetails>
        <MetaDataGrid>
          <DateInterval
            start={new Date(event.start_time)}
            end={new Date(event.end_time)}
          />
          <RightAlign>{isHappening && <HappeningNowStyled />}</RightAlign>
        </MetaDataGrid>

        <ClubName>{event.club_name}</ClubName>
        <EventName>{event.name}</EventName>
        {event.url && <EventLink href={event.url}>{event.url}</EventLink>}
        <StyledDescription html={event.description} />
        <RightAlign>
          <TransparentButton
            backgroundColor={CLUBS_BLUE}
            onClick={() => router.push(CLUB_ROUTE(), CLUB_ROUTE(event.club))}
          >
            See Club Details <Icon name="chevrons-right" alt="chevrons-right" />
          </TransparentButton>
        </RightAlign>
      </EventDetails>
    </ModalContainer>
  )
}

export default EventModal
