import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import React, { useState } from 'react'
import styled from 'styled-components'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

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
  padding: 12px;
  position: absolute;
  top: 50%;

  &:hover {
    opacity: 1;
  }
`

const CarouselWrapper = styled.div`
  padding: 10px 35px;
`

type EventsProps = {
  data: ClubEvent[]
}

const EventCarousel = ({ data }: EventsProps) => {
  const [show, setShow] = useState(false)
  const [modalData, setModalData] = useState<ClubEvent>()

  const showModal = (entry: ClubEvent) => {
    setModalData(entry)
    setShow(true)
  }
  const hideModal = () => setShow(false)

  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      <div>
        <StrongText className="mb-0">Events</StrongText>
        <small>Click on an event to get more details.</small>
      </div>

      <CarouselWrapper>
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={50}
          navigation={{ nextEl: '.arrow-left', prevEl: '.arrow-right' }}
          draggable
          scrollbar={{ draggable: true }}
          centeredSlides
          centeredSlidesBounds
          slidesPerView="auto"
        >
          {data.map((entry, index) => (
            <SwiperSlide
              key={index}
              style={{
                maxWidth: '250px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
              onClick={() => showModal(entry)}
            >
              <EventCard event={entry} key={index} />
            </SwiperSlide>
          ))}
        </Swiper>
      </CarouselWrapper>
      <Arrow className="arrow-left" style={{ right: '-15px' }}>
        <Icon name="chevron-right" size={'2.2rem'} />
      </Arrow>
      <Arrow className=" arrow-right" style={{ left: '-15px' }}>
        <Icon name="chevron-left" size={'2.2rem'} />
      </Arrow>
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
