import React from 'react'
import s from 'styled-components'

import { DARK_BLUE, LIGHTER_BLUE, DARK_GRAY, FOCUS_GRAY } from '../../constants/colors'

export const Tag = s.span`
  margin: 2px;
  fontSize: .7em;
  font-weight: 600;
`

export const BlueTag = s(Tag)`
  background-color: ${LIGHTER_BLUE} !important;
  color: ${DARK_BLUE} !important;
`

export const InactiveTag = s(Tag)`
  background-color: ${FOCUS_GRAY} !important;
  color: ${DARK_GRAY} !important;
`
