import s from 'styled-components'
import { BORDER } from '../../constants/colors'

export const Line = s.hr`
  height: 2px;
  width: 100%;
  background: ${BORDER};
`
