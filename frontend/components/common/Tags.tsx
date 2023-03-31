import Color from 'color'
import styled from 'styled-components'

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

export const Tag = styled.span<{ color?: string; foregroundColor?: string }>`
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

  &.tag {
    white-space: normal;
    display: inline-block;
    height: auto;
    padding-top: 0.25em;
    padding-bottom: 0.25em;
  }
`

export const BlueTag = styled(Tag)`
  background-color: orange !important;
  color: black !important;
`

export const SelectedTag = styled(Tag)`
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${PRIMARY_TAG_TEXT} !important;
`

export const InactiveTag = styled(Tag)`
  background-color: ${FOCUS_GRAY} !important;
  color: ${DARK_GRAY} !important;
`

export const DetailTag = InactiveTag
