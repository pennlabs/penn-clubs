import styled from 'styled-components'

import { ANIMATION_DURATION, BORDER } from '../../constants'

type CardProps = {
  $bordered?: boolean
  $hoverable?: boolean
  $background?: string
  $pinned?: boolean
}

export const CARD_BORDER_RADIUS = '4px'
export const Card = styled.div<CardProps>`
  padding: 0.5rem;
  width: 100%;
  box-shadow: 0 0 0 transparent;
  border-radius: ${CARD_BORDER_RADIUS};
  transition: all ${ANIMATION_DURATION}ms ease;
  background-color: ${({ $background }) => $background || 'transparent'};

  ${({ $bordered }) => $bordered && `border: 1px solid ${BORDER};`}

  ${({ $hoverable }) =>
    $hoverable &&
    `
  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  `}
`
