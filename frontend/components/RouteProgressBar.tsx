import { useRouter } from 'next/router'
import React, { ReactElement, ReactPortal, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import styled, { Keyframes, keyframes } from 'styled-components'

import { CLUBS_BLUE, CLUBS_RED, LONG_ANIMATION_DURATION } from '~/constants'

enum RouteProgressState {
  ROUTE_CHANGE_START = 'START',
  ROUTE_CHANGE_COMPLETE = 'COMPLETE',
  ROUTE_CHANGE_ERROR = 'ERROR',
}

const keyframeForState = (state: RouteProgressState): Keyframes => {
  switch (state) {
    case RouteProgressState.ROUTE_CHANGE_START:
      return keyframes`
      0% {
        width: 0%;
        background: transparent;
      }
      100% {
        width: 35%;
        background: ${CLUBS_BLUE};
      }
      `
    case RouteProgressState.ROUTE_CHANGE_COMPLETE:
      return keyframes`
      0% {
        width: 35%;
        background: ${CLUBS_BLUE};
      }
      50% {
        width: 100%;
        background: ${CLUBS_BLUE};
      }
      100% {
        width: 100%;
        background: transparent;
      }
      `
    case RouteProgressState.ROUTE_CHANGE_ERROR:
      return keyframes`
      0% {
        width: 35%;
        background: ${CLUBS_BLUE};
      }
      50% {
        width: 100%;
        background: ${CLUBS_RED};
      }
      100% {
        width: 100%;
        background: transparent;
      }`
  }
}

type ProgressBarProps = {
  $state: RouteProgressState | null
}

const ProgressBar = styled.div<ProgressBarProps>`
  position: absolute;
  height: 100%;
  animation-name: ${({ $state }) =>
    $state ? keyframeForState($state) : 'none'};
  animation-duration: ${LONG_ANIMATION_DURATION};
  animation-timing-function: ease-in-out;
  animation-fill-mode: forwards;
`

const ProgressBarContainer = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 3px;
  z-index: 1002;
`

type RouteProgressBarProps = {
  fireThreshold?: number
}

const RouteProgressBar = ({
  fireThreshold = 250,
}: RouteProgressBarProps): ReactPortal | ReactElement => {
  const container =
    typeof window !== 'undefined'
      ? document.querySelector("nav[aria-label='main navigation']")
      : null
  const router = useRouter()
  const [state, setState] = useState<RouteProgressState | null>(null)

  useEffect(() => {
    const genHandler = (state: RouteProgressState) => () => setState(state)
    let timeout: number | null = null
    const handlers = {
      routeChangeStart: () => {
        timeout = window.setTimeout(
          genHandler(RouteProgressState.ROUTE_CHANGE_START),
          fireThreshold,
        )
      },
      routeChangeComplete: () => {
        if (timeout != null) clearTimeout(timeout)
        setState(RouteProgressState.ROUTE_CHANGE_COMPLETE)
      },
      routeChangeError: genHandler(RouteProgressState.ROUTE_CHANGE_ERROR),
    }
    for (const key in handlers) {
      router.events.on(key, handlers[key])
    }
    return () => {
      for (const key in handlers) {
        router.events.off(key, handlers[key])
      }
    }
  }, [])

  return container ? (
    ReactDOM.createPortal(
      <ProgressBarContainer>
        <ProgressBar $state={state} />
      </ProgressBarContainer>,
      container,
    )
  ) : (
    <ProgressBarContainer>
      <ProgressBar $state={null} />
    </ProgressBarContainer>
  )
}

export default RouteProgressBar
