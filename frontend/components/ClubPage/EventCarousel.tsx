import React, { useState } from 'react'
import styled from 'styled-components'

import { ClubEvent } from '../../types'
import { Icon, StrongText } from '../common'
import Modal from '../common/Modal'
import EventCard from '../EventPage/EventCard'
import EventModal from '../EventPage/EventModal'

const Arrow = styled.div`
  z-index: 100;
  opacity: 0.6;
  transition-duration: 300ms;
  cursor: pointer;
  padding: 12px
  &:hover {
    opacity: 1;
  }
`

const EventWrapper = styled.div`
  padding: 25px;
  display: inline-block;
  transition: transform 0.5s ease-in-out;
`

const Carousel = styled.div`
  position: relative;
  display: flex;
  white-space: nowrap;
  left: -15px;
`

const CarouselWrapper = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
`

type EventsProps = {
  data: ClubEvent[]
}

const EventCarousel = ({ data }: EventsProps) => {
  const [show, setShow] = useState(false)
  const [modalData, setModalData] = useState<ClubEvent>()
  const [dataChange, setDataChange] = useState(data)

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
    tablet: {
      breakpoint: { max: 1400, min: 580 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 580, min: 0 },
      items: 1,
    },
  }

  const changeRight = () => {
    setDataChange((prevData) => {
      const newData = [...prevData]
      const firstElement = newData.shift()
      newData.push(firstElement)
      return newData
    })
  }

  const changeLeft = () => {
    setDataChange((prevData) => {
      const newData = [...prevData]
      const lastElement = newData.pop()
      newData.unshift(lastElement)
      return newData
    })
  }
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div className="">
        <StrongText className="mb-0">Events</StrongText>
        <small>Click on an event to get more details.</small>
      </div>
      <div
        style={{
          height: '260px',
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Arrow onClick={changeLeft}>
          <Icon name="chevron-left" size={'2.2rem'} />
        </Arrow>

        <CarouselWrapper>
          <Carousel>
            {dataChange.map((entry, index) => (
              <div key={index}>
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
        </CarouselWrapper>
        <Arrow onClick={changeRight}>
          <Icon name="chevron-right" size={'2.2rem'} />
        </Arrow>
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
