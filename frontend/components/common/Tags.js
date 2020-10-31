import Color from 'color'
import s from 'styled-components'

import {
  CLUBS_BLUE,
  CLUBS_DEEP_BLUE,
  CLUBS_LIGHT_BLUE,
  DARK_GRAY,
  FOCUS_GRAY,
  WHITE,
} from '../../constants/colors'

const calculateForegroundColor = (color) => {
  let obj = Color(`#${color}`)
  if (obj.isDark()) {
    obj = obj.lighten(0.8)
  } else {
    obj = obj.darken(0.5)
  }
  return obj.hex()
}

export const Tag = s.span`
  margin: 0 4px 4px 0;
  font-weight: 600;
  ${({ color }) =>
    color &&
    `
    background-color: #${color} !important;
    color: ${calculateForegroundColor(color)} !important;
  `}
`

export const BlueTag = s(Tag)`
  background-color: ${CLUBS_LIGHT_BLUE} !important;
  color: ${CLUBS_BLUE} !important;
`

export const SelectedTag = s(Tag)`
  background-color: ${CLUBS_DEEP_BLUE} !important;
  color: ${WHITE} !important;
`

export const InactiveTag = s(Tag)`
  background-color: ${FOCUS_GRAY} !important;
  color: ${DARK_GRAY} !important;
`

export const DetailTag = InactiveTag