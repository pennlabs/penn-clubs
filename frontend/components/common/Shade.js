import styled from 'styled-components'

import { ALLBIRDS_GRAY } from '../../constants/colors'
import { LONG_ANIMATION_DURATION } from '../../constants/measurements'
import { fadeIn, fadeOut } from './Animations'

export default styled.div`
  position: fixed;
  width: 100vw;
  height: 100vh;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  background: ${ALLBIRDS_GRAY};
  z-index: 1007;
  text-align: center;
  animation-name: ${({ isNewlyMounted, show }) => {
    if (isNewlyMounted) {
      return ''
    }
    return show ? fadeIn : fadeOut
  }};
  animation-duration: ${LONG_ANIMATION_DURATION};
  opacity: ${({ show }) => (show ? '.75' : '0')};
`
