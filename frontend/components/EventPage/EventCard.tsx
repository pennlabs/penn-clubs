import React, { ReactElement, useState } from 'react'
import LazyLoad from 'react-lazy-load'
import styled from 'styled-components'

import { Icon, Modal } from '../../components/common'
import { WHITE } from '../../constants/colors'
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
import EventModal, { MEETING_REGEX } from './EventModal'
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
const clipLink = (s: string) => (s.length > 32 ? `${s.slice(0, 35)}...` : s)

const EventCard = (props: {
  event: ClubEvent
  isHappening: boolean
}): ReactElement => {
  const { event, isHappening } = props
  const {
    image_url: imageUrl,
    club_name: clubName,
    start_time,
    end_time,
    name,
    url,
  } = event
  const [modalVisible, setModalVisible] = useState(false)

  const showModal = () => setModalVisible(true)
  const hideModal = () => setModalVisible(false)

  return (
    <>
      <EventCardContainer className="event">
        <Card bordered hoverable background={WHITE} onClick={showModal}>
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
          <DateInterval start={new Date(start_time)} end={new Date(end_time)} />
          {isHappening && <HappeningNow />}
          <ClubName>{clubName}</ClubName>
          <EventName>{name}</EventName>
          {url && MEETING_REGEX.test(url) && <Icon name="video" />}{' '}
          {url && <EventLink href={url}>{clipLink(url)}</EventLink>}
        </Card>
      </EventCardContainer>
      {modalVisible && (
        <Modal show={modalVisible} closeModal={hideModal} width="45%">
          <EventModal {...props} />
        </Modal>
      )}
    </>
  )
}

export default EventCard
