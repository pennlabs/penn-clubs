import { ReactElement, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { ALLBIRDS_GRAY, BLUE, BORDER } from '../../constants/colors'

const SIZE = '2.5rem'
const THICKNESS = '0.25rem'
const TIMER = '1.25s'

type LoadingWrapperProps = {
  $hide: boolean
}

const LoadingWrapper = styled.div<LoadingWrapperProps>`
  width: 100%;
  padding: calc(1rem + 5vh) 0;
  text-align: center;
  transition: opacity 0.5s ease;
  opacity: ${({ $hide }) => ($hide ? '0' : '1')};
`

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const LoadingCircle = styled.span`
  display: inline-block;
  width: ${SIZE};
  height: ${SIZE};
  border-radius: 50%;
  border-width: ${THICKNESS};
  border-style: solid;
  border-right-color: ${BORDER};
  border-left-color: ${BLUE};
  border-bottom-color: ${BLUE};
  border-top-color: ${BLUE};
  animation: ${spin} ${TIMER} infinite linear;
`

type LoadingProps = { title?: string; delay?: number }

export const Loading = ({
  title = 'Loading...',
  delay = 200,
}: LoadingProps): ReactElement => {
  const [hidden, toggleHidden] = useState(delay > 0)

  useEffect(() => {
    if (hidden && delay > 0) {
      const timer = setTimeout(() => {
        toggleHidden(false)
      }, delay)
      return () => clearTimeout(timer)
    }
  })

  return (
    <LoadingWrapper $hide={hidden}>
      <LoadingCircle />
      {title && <p style={{ color: ALLBIRDS_GRAY }}>{title}</p>}
    </LoadingWrapper>
  )
}
