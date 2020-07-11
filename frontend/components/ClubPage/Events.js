import s from 'styled-components'

import { WHITE } from '../../constants/colors'
import { M2, M3 } from '../../constants/measurements'
import { Card, Icon, StrongText } from '../common'

const Events = ({ data }) => {
  const StyledCard = s(Card)`
    background-color: ${WHITE};
    margin-bottom: ${M3};
    padding-left: ${M2};
  `
  const BigParagraph = s.p`
    font-size: 0.8rem;
    font-weight: bold;
  `

  const SmallParagraph = s.p`
    font-size: 0.8rem;
  `

  const Wrapper = s.div`
    marginBottom: 0.5rem;
    display: flex;
  `

  if (!data || !data.length) {
    return null
  }

  return (
    <StyledCard bordered>
      <StrongText>Events</StrongText>
      {data.map((entry, index) => {
        return (
          <Wrapper key={index}>
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
                }).format(new Date(entry.start_time))}{' '}
                | {entry.location}
              </BigParagraph>
              <SmallParagraph>{entry.name}</SmallParagraph>
            </div>
          </Wrapper>
        )
      })}
    </StyledCard>
  )
}

export default Events
