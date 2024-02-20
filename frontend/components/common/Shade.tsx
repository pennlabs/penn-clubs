import styled from 'styled-components'

import { fadeIn, fadeOut } from '../../constants/animations'
import { BLACK_ALPHA } from '../../constants/colors'
import { LONG_ANIMATION_DURATION } from '../../constants/measurements'

export const Shade = styled.div<{ $isNewlyMounted?: boolean; $show: boolean }>`
  position: fixed;
  width: 100vw;
  height: 100vh;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  background: ${BLACK_ALPHA(0.5)};
  text-align: center;
  animation-name: ${({ $isNewlyMounted, $show }) => {
    if ($isNewlyMounted) {
      return ''
    }
    return $show ? fadeIn : fadeOut
  }};
  animation-duration: ${LONG_ANIMATION_DURATION};
  opacity: ${({ $show }) => ($show ? '1' : '0')};
`

export default Shade
