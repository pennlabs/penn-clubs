import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_NAVY, WHITE } from '../../constants/colors'
import { CARD_BORDER_RADIUS } from '../common/Card'

const Placeholder = styled.div<{ inCard?: boolean }>`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  display: grid;
  & > p {
    margin: auto;
  }
  background-color: ${CLUBS_NAVY};
  height: 9.5rem;
  color: white;

  ${({ inCard }) =>
    inCard
      ? `
  margin: -0.5rem -0.5rem 0.5rem;`
      : `
  width: 100%;
  margin-top: -1.5rem;
  `}
`
const CoverPhoto = styled.div<{ image: string | null; inCard?: boolean }>`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  color: ${WHITE};
  height: 0;
  padding-bottom: 56.25%;
  background-image: url(${(props) => props.image});
  background-size: cover;

  ${({ inCard }) =>
    inCard
      ? `
  margin: -0.5rem -0.5rem 0.5rem;`
      : `
  width: 100%;
  margin-top: -1.5rem;
  `}
`

interface CoverPhotoProps {
  image: string | null
  fallback: ReactElement
  inCard?: boolean
}

export default (props: CoverPhotoProps): ReactElement =>
  props.image ? (
    <CoverPhoto image={props.image} inCard={props.inCard} />
  ) : (
    <Placeholder inCard={props.inCard}>{props.fallback}</Placeholder>
  )
