import Color from 'color'
import s from 'styled-components'

import {
  DARK_GRAY,
  FOCUS_GRAY,
  PRIMARY_TAG_BG,
  PRIMARY_TAG_TEXT,
} from '../../constants/colors'

const calculateForegroundColor = (color: string): string => {
  let obj = Color(`#${color}`)
  if (obj.isDark()) {
    obj = obj.lighten(0.8)
  } else {
    obj = obj.darken(0.5)
  }
  return obj.hex()
}

export const Tag = s.span<{ color?: string; foregroundColor?: string }>`
  margin: 0 4px 4px 0;
  font-weight: 600;
  ${({ color, foregroundColor }) =>
    color &&
    `
    background-color: #${
      color.startsWith('#') ? color.substr(1) : color
    } !important;
    color: ${foregroundColor ?? calculateForegroundColor(color)} !important;
  `}
`

export const BlueTag = s(Tag)`
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${PRIMARY_TAG_TEXT} !important;
`

export const SelectedTag = s(Tag)`
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${PRIMARY_TAG_TEXT} !important;
`

export const InactiveTag = s(Tag)`
  background-color: ${FOCUS_GRAY} !important;
  color: ${DARK_GRAY} !important;
`

export const DetailTag = InactiveTag
