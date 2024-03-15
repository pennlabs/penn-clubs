import 'react-multi-carousel/lib/styles.css'

import React, { ReactElement, useState } from 'react'
import Carousel from 'react-multi-carousel'
import styled from 'styled-components'

import { ClubEvent } from '../../types'
import { Icon, StrongText } from '../common'
import Modal from '../common/Modal'
import EventCard from '../EventPage/EventCard'
import EventModal from '../EventPage/EventModal'

const LeftArrow = styled.div`
  left: -10px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  opacity: 0.6;
  transition-duration: 300ms;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`
const RightArrow = styled.div`
  right: -10px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  opacity: 0.6;
  transition-duration: 300ms;
  cursor: pointer;
  &:hover {
    opacity: 1;
  }
`

const CarouselWrapper = styled.div`
  position: absolute;
  box-sizing: border-box;
  width: 100%;
`
const EventWrapper = styled.div`
  @media only screen and (max-width: 580px) {
    margin: 25px;
  }
  @media only screen and (min-width: 580px) and (max-width: 900px) {
    margin: 8px;
  }
  @media only screen and (min-width: 900px) and (max-width: 1400px) {
    margin: 12px;
  }
  @media only screen and (min-width: 1400px) {
    margin: 5px;
  }
`

type EventsProps = {
  data: ClubEvent[]
}

const EventCarousel = ({ data }: EventsProps): ReactElement | null => {
  const [show, setShow] = useState(false)
  const [modalData, setModalData] = useState<ClubEvent>()

  const showModal = (entry: ClubEvent) => {
    setModalData(entry)
    setShow(true)
  }
  const hideModal = () => setShow(false)
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 1400 },
      items: 3,
    },
    desktop: {
      breakpoint: { max: 1401, min: 1400 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1400, min: 580 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 580, min: 0 },
      items: 1,
    },
  }
  return (
    <div>
      <div className="">
        <StrongText className="mb-0">Events</StrongText>
        <small>Click on an event to get more details.</small>
      </div>
      <div
        style={{
          height: '35vh',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <CarouselWrapper>
          <div style={{ position: 'unset' }}>
            <Carousel
              responsive={responsive}
              showDots={false}
              draggable={true}
              customLeftArrow={
                <LeftArrow>
                  <Icon name="chevron-left" size={'2.2rem'} />
                </LeftArrow>
              }
              customRightArrow={
                <RightArrow>
                  <Icon name="chevron-right" size={'2.2rem'} />
                </RightArrow>
              }
            >
              {data.map((entry, index) => (
                <div onClick={() => showModal(entry)}>
                  <EventWrapper>
                    <EventCard
                      event={entry}
                      key={index}
                      onClick={() => showModal(entry)}
                      onLinkClicked={() => hideModal()}
                    />
                  </EventWrapper>
                </div>
              ))}
            </Carousel>
          </div>
        </CarouselWrapper>
      </div>
      {show && (
        <Modal show={show} closeModal={hideModal} marginBottom={false}>
          {modalData && (
            <EventModal event={modalData} showDetailsButton={false} />
          )}
        </Modal>
      )}
    </div>
  )
}

export default EventCarousel
