import Color from 'color'
import styled from 'styled-components'

import {
  DARK_GRAY,
  FOCUS_GRAY,
  PRIMARY_TAG_BG,
  PRIMARY_TAG_TEXT,
} from '../../constants/colors'

const normalizeHex = (color: string): string =>
  color.startsWith('#') ? color.slice(1) : color

const calculateForegroundColor = (color: string): string => {
  let obj = Color(`#${normalizeHex(color)}`)
  if (obj.isDark()) {
    obj = obj.lighten(0.8)
  } else {
    obj = obj.darken(0.5)
  }
  return obj.hex()
}

export const Tag = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'foregroundColor' && prop !== 'color',
})<{ color?: string; foregroundColor?: string }>`
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
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    height: auto;
    padding-top: 0.25em;
    padding-bottom: 0.25em;

    .delete {
      border-radius: 9999px;
      height: 1.35em !important;
      width: 1.35em !important;
      min-height: 1.35em !important;
      min-width: 1.35em !important;
      font-size: 0.95em !important;
      padding: 0;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: 0.25em;
      color: white;
    }
  }
`

export const BlueTag = styled(Tag)`
  background-color: ${PRIMARY_TAG_BG} !important;
  color: ${PRIMARY_TAG_TEXT} !important;
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
