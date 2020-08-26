import { ReactElement, useState } from 'react'
import Linkify from 'react-linkify'
import styled from 'styled-components'

import { WHITE } from '../../constants/colors'
import { M2, M3 } from '../../constants/measurements'
import { ClubEvent } from '../../types'
import { Card, Icon, StrongText } from '../common'
import Modal from '../common/Modal'
import EventModal from '../EventPage/EventModal'

type EventsProps = {
  data: [ClubEvent]
}

const StyledCard = styled(Card)`
  background-color: ${WHITE};
  margin-bottom: ${M3};
  padding-left: ${M2};
`
const BigParagraph = styled.p`
  font-size: 0.8rem;
  font-weight: bold;
`

const SmallParagraph = styled.p`
  font-size: 0.8rem;
`

const Wrapper = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  cursor: pointer;
`

const Event = ({ entry }: { entry: ClubEvent }): ReactElement => {
  const [show, setShow] = useState(false)
  const showModal = () => setShow(true)
  const hideModal = () => setShow(false)
  return (
    <Wrapper onClick={showModal}>
      <Icon
        name="calendar"
        style={{ marginRight: '7px' }}
        size="32px"
        alt="Calendar icon"
      />
      <div>
        <BigParagraph>
          {new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric',
          }).format(new Date(entry.start_time))}
          {entry.location && ` | ${entry.location}`}
        </BigParagraph>
        <SmallParagraph>
          <Linkify>{entry.name}</Linkify>
        </SmallParagraph>
        <Modal show={show} closeModal={hideModal}>
          <EventModal event={entry} isHappening={false} />
        </Modal>
      </div>
    </Wrapper>
  )
}
const Events = ({ data }: EventsProps): ReactElement | null => {
  if (!data || !data.length) {
    return null
  }

  return (
    <StyledCard bordered>
      <StrongText>Events</StrongText>
      {data.map((entry, index) => (
        <Event entry={entry} key={index} />
      ))}
    </StyledCard>
  )
}

export default Events
