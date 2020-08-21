import styled from 'styled-components'
import { CARD_BORDER_RADIUS } from '../common/Card'
import { CLUBS_NAVY, WHITE } from '../../constants/colors'

interface CoverPhotoProps {
  image?: string
}

const CoverPhoto = styled.div<CoverPhotoProps>`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  height: 7rem;
  background-color: ${CLUBS_NAVY};
  margin: -0.5rem -0.5rem 0.5rem;
  color: ${WHITE};
  display: grid;

  & > p {
    margin: auto;
  }
`

export default CoverPhoto
