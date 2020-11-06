import Color from 'color'
import styled from 'styled-components'

import { WHITE, WHITE_ALPHA } from '../../constants/colors'

interface TransparentButtonProps {
  backgroundColor?: string
  textColor?: string
}
export const TransparentButton = styled.button<TransparentButtonProps>`
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

export const TransparentButtonLink = styled.a<TransparentButtonProps>`
  width: 12.5em;
  height: 2.5em;
  line-height: 2.5em;
  border-radius: 17px;
  border: 0;
  background: ${({ backgroundColor }) => backgroundColor || WHITE_ALPHA(0.32)};
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: ${({ textColor }) => textColor || WHITE};
  cursor: pointer;
  transition: background-color 0.25s ease;

  &:hover {
    color: ${({ textColor }) => textColor || WHITE};
    background-color: ${({ backgroundColor }) =>
      Color(backgroundColor || WHITE_ALPHA(0.32))
        .whiten(0.4)
        .hex()};
  }
  `
