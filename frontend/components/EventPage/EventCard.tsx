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
import HappeningNow from './HappeningNow'
import {
  mediaMaxWidth,
  mediaMinWidth,
  PHONE,
} from '../../constants/measurements'

const CardContainer = styled.div`
  ${mediaMinWidth(PHONE)} {
    max-width: 18em;
    margin: 1rem;
  }
  ${mediaMaxWidth(PHONE)} {
    margin: 1rem 0;
  }
`
const clipLink = (s: string) => (s.length > 40 ? `${s.slice(0, 37)}...` : s)

const EventCard = (props: {
  event: ClubEvent
  isHappening: boolean
}): ReactElement => {
  const { event, isHappening } = props
  const { image_url, club_name, start_time, end_time, name, url } = event
  const [modalVisible, setModalVisible] = useState(false)

  const showModal = () => setModalVisible(true)
  const hideModal = () => setModalVisible(false)

  return (
    <>
      <CardContainer>
        <Card bordered hoverable background={WHITE} onClick={showModal}>
          <CoverPhoto
            image={image_url}
            fallback={
              <p>
                <b>{club_name.toLocaleUpperCase()}</b>
              </p>
            }
          />
          <DateInterval start={new Date(start_time)} end={new Date(end_time)} />
          {isHappening && <HappeningNow />}
          <ClubName>{club_name}</ClubName>
          <EventName>{name}</EventName>
          {url && <EventLink href={url}>{clipLink(url)}</EventLink>}
        </Card>
      </CardContainer>
      <Modal show={modalVisible} closeModal={hideModal} width="45%">
        <EventModal {...props} />
      </Modal>
    </>
  )
}

export default EventCard
