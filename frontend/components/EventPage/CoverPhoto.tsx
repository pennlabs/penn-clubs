import styled from 'styled-components'
import { CARD_BORDER_RADIUS } from '../common/Card'
import { CLUBS_NAVY, WHITE } from '../../constants/colors'
import { ReactElement } from 'react'

const CoverPhoto = styled.div<{ image: string | null }>`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  height: 7rem;
  margin: -0.5rem -0.5rem 0.5rem;
  color: ${WHITE};
  display: grid;

  & > p {
    margin: auto;
  }

  ${({ image }) =>
    image
      ? `
  background-image: url(${image});
  background-size: cover;
  `
      : `
  background-color: ${CLUBS_NAVY};
      `}
`

interface CoverPhotoProps {
  image: string | null
  fallback: ReactElement
}

export default (props: CoverPhotoProps): ReactElement => (
  <CoverPhoto image={props.image || null}>
    {props.image ? <></> : props.fallback}
  </CoverPhoto>
)
