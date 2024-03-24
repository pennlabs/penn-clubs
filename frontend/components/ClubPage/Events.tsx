import { ReactElement, useState } from 'react'
import Linkify from 'react-linkify'
import styled from 'styled-components'

import { DARK_BLUE, HOVER_GRAY, PURPLE, WHITE } from '../../constants/colors'
import { M2, M3 } from '../../constants/measurements'
import { ClubEvent, ClubEventType } from '../../types'
import { Card, Icon, StrongText } from '../common'

type EventsProps = {
  data: ClubEvent[]
}

export const StyledCard = styled(Card)`
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
  border-radius: 8px;
  padding: 2px;

  &:hover {
    background-color: ${HOVER_GRAY};
  }
`

export const Event = ({ entry }: { entry: ClubEvent }): ReactElement => {
  const [show, setShow] = useState(false)
  const showModal = () => setShow(true)
  const hideModal = () => setShow(false)
  return (
    <>
      <Wrapper onClick={showModal}>
        <Icon
          name={entry.type === ClubEventType.FAIR ? 'tent' : 'calendar'}
          style={{
            marginRight: '7px',
            color: entry.type === ClubEventType.FAIR ? PURPLE : DARK_BLUE,
          }}
          size="32px"
          alt="Calendar icon"
        />
        <div>
          <BigParagraph suppressHydrationWarning>
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
        </div>
      </Wrapper>
    </>
  )
}
const Events = ({ data }: EventsProps): ReactElement | null => {
  if (!data || !data.length) {
    return null
  }

  return (
    <StyledCard $bordered>
      <div className="mb-3">
        <StrongText className="mb-0">Events</StrongText>
        <small>Click on an event to get more details.</small>
      </div>
      {data.map((entry, index) => (
        <Event entry={entry} key={index} />
      ))}
    </StyledCard>
  )
}

export default Events
