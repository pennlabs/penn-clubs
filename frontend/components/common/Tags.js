import Color from 'color'
import s from 'styled-components'

import {
  CLUBS_DEEP_BLUE,
  DARK_GRAY,
  FOCUS_GRAY,
  PRIMARY_TAG_BG,
  PRIMARY_TAG_TEXT,
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
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${PRIMARY_TAG_TEXT} !important;
`

export const SelectedTag = s(Tag)`
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${WHITE} !important;
`

export const InactiveTag = s(Tag)`
  background-color: ${FOCUS_GRAY} !important;
  color: ${DARK_GRAY} !important;
`

export const DetailTag = InactiveTag
