import s from 'styled-components'

import { BORDER } from '../../constants/colors'
import { ANIMATION_DURATION } from '../../constants/measurements'

type CardProps = {
  bordered?: boolean
  hoverable?: boolean
}

export const Card = s.div<CardProps>`
  padding: 0.5rem;
  width: 100%;
  box-shadow: 0 0 0 transparent;
  border-radius: 4px;
  transition: all ${ANIMATION_DURATION}ms ease;

  ${({ bordered }) => bordered && `border: 1px solid ${BORDER};`}

  ${({ hoverable }) =>
    hoverable &&
    `
  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }
  `}
`
