import React, { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Modal } from '../../components/common'
import { WHITE } from '../../constants/colors'
import { ClubEvent } from '../../types'
import { Card } from '../common/Card'
import { ClubName, EventLink, EventName } from './common'
import CoverPhoto from './CoverPhoto'
import DateInterval from './DateInterval'
import EventModal from './EventModal'
import HappeningNowStyled from './HappeningNow'

const CardContainer = styled.div`
  max-width: 18em;
`
const clipLink = (s: string) => (s.length > 40 ? `${s.slice(0, 37)}...` : s)

const EventCard = (props: {
  event: ClubEvent
  isHappening: boolean
}): ReactElement => {
  const { event, isHappening } = props
  const [showModal, setShowModal] = useState(false)

  const doShow = () => setShowModal(true)
  const doClose = () => setShowModal(false)

  return (
    <>
      <CardContainer>
        <Card bordered hoverable background={WHITE} onClick={doShow}>
          <CoverPhoto
            image={event.image_url}
            fallback={
              <p>
                <b>{event.club_name.toLocaleUpperCase()}</b>
              </p>
            }
            inCard
          />
          <DateInterval
            start={new Date(event.start_time)}
            end={new Date(event.end_time)}
          />
          {isHappening && <HappeningNowStyled />}
          <ClubName>{event.club_name}</ClubName>
          <EventName>{event.name}</EventName>
          {event.url && (
            <EventLink href={event.url}>{clipLink(event.url)}</EventLink>
          )}
        </Card>
      </CardContainer>
      <Modal show={showModal} closeModal={doClose} width="45%">
        <EventModal {...props} />
      </Modal>
    </>
  )
}

export default EventCard
