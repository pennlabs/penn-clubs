import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_NAVY, WHITE } from '../../constants'
import { SIXTEEN_BY_NINE } from '../../constants/measurements'
import { Card, CARD_BORDER_RADIUS } from '../common/Card'
import { ModalContentWrapper } from '../common/Modal'

const Placeholder = styled.div`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  display: grid;
  & > p {
    margin: auto;
  }
  background-color: ${CLUBS_NAVY};
  height: 9.5rem;
  color: white;
  text-align: center;

  ${Card} & {
    margin: -0.5rem -0.5rem 0.5rem;
  }
  ${ModalContentWrapper} & {
    width: 100%;
    margin: -1.5rem 0 0 0;
  }
`
const CoverPhotoImage = styled.div`
  border-radius: ${CARD_BORDER_RADIUS} ${CARD_BORDER_RADIUS} 0 0;
  color: ${WHITE};
  height: 0;
  padding-bottom: ${SIXTEEN_BY_NINE};
  background-size: cover;
  background-position: center;
  ${Card} & {
    margin: -0.5rem -0.5rem 0.5rem;
  }
  ${ModalContentWrapper} & {
    width: 100%;
    margin: -1.5rem 0 0 0;
  }
`

interface CoverPhotoProps {
  image: string | null
  fallback: ReactElement<any>
}

const CoverPhoto = ({ image, fallback }: CoverPhotoProps): ReactElement<any> =>
  image ? (
    <CoverPhotoImage style={{ backgroundImage: `url(${image})` }} />
  ) : (
    <Placeholder> {fallback}</Placeholder>
  )

export default CoverPhoto
