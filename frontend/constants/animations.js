import { keyframes } from 'styled-components'

export const SHORT_ANIMATION_DURATION = 200

export const fadeIn = keyframes`
  0% {
    opacity: 0;
    max-height: 100vh;
  }
  100% {
    opacity: 1;
    max-height: 100vh;
  }
`

export const fadeOut = keyframes`
  0% {
    opacity: 1;
    max-height: 100vh;
  }
  100% {
    opacity: 0;
    max-height: 100vh;
  }
`
