import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import React, { useState } from 'react'
import styled from 'styled-components'
import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { ClubEvent, EventShowing } from '../../types'
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
  events: ClubEvent[]
}

type EventShowingWithEvent = EventShowing & { event: ClubEvent }

const EventCarousel = ({ events }: EventsProps) => {
  const [show, setShow] = useState(false)
  const [modalData, setModalData] = useState<EventShowingWithEvent>()

  // flatten showings and set showing.event to the event
  const showings: EventShowingWithEvent[] = events
    .filter((event) => event.showings)
    .flatMap((event) =>
      event.showings!.map((showing) => ({ ...showing, event })),
    )

  const showModal = (entry: EventShowingWithEvent) => {
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
          {showings.map((entry, index) => (
            <SwiperSlide
              key={index}
              style={{
                maxWidth: '250px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
              onClick={() => showModal(entry)}
            >
              <EventCard
                event={entry.event!}
                start_time={entry.start_time}
                end_time={entry.end_time}
              />
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
            <EventModal
              event={modalData.event!}
              start_time={modalData.start_time}
              end_time={modalData.end_time}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

export default EventCarousel
