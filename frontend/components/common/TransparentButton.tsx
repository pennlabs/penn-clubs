import { ReactElement } from 'react'
import s from 'styled-components'

import { WHITE, WHITE_ALPHA } from '../../constants/colors'
import { Icon } from './Icon'

interface TransparentButtonProps {
  backgroundColor?: string
  textColor?: string
}
export const TransparentButton = s.button<TransparentButtonProps>`
  width: 12.5em;
  height: 2.5em;
  border-radius: 17px;
  border: 0;
  background: ${({ backgroundColor }) => backgroundColor || WHITE_ALPHA(0.32)};
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: ${({ textColor }) => textColor || WHITE};
  cursor: pointer;
  `
