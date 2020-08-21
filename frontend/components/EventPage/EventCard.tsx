import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { WHITE } from '../../constants/colors'
import { ClubEvent } from '../../types'
import { Card } from '../common/Card'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import HappeningNowStyled from './HappeningNow'

const CardContainer = styled.div`
  max-width: 18em;
`

const EventCard = (props: {
  event: ClubEvent
  isHappening: boolean
}): ReactElement => {
  const { event, isHappening } = props

  return (
    <CardContainer>
      <Card bordered hoverable background={WHITE}>
        <CoverPhoto>
          <p>{event.club_name.toLocaleUpperCase()}</p>
        </CoverPhoto>
        <DateInterval
          start={new Date(event.start_time)}
          end={new Date(event.end_time)}
        />
        {isHappening && <HappeningNowStyled />}
        <ClubName>{event.club_name}</ClubName>
        <EventName>{event.name}</EventName>
        {event.url && <EventLink href={event.url}>{event.url}</EventLink>}
      </Card>
    </CardContainer>
  )
}

export default EventCard
