import s from 'styled-components'
import { CLUBS_GREY, CLUBS_NAVY, MEDIUM_GRAY } from '../../constants/colors'

export const Text = s.p`
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  ${({ isGray }) => (isGray ? `color: ${CLUBS_GREY};` : '')}
  ${({ color }) => (color ? `color: ${color};` : '')}
`

export const SmallText = s(Text)`
  font-size: 80%;
`

export const StrongText = s(Text)`
  margin-bottom: 0.5rem;
  color: ${CLUBS_NAVY};
  font-weight: bold;
`

export const Title = s.h1`
  font-size: 2rem;
  font-weight: bold;
`

export const Empty = s(Text)`
  color: ${MEDIUM_GRAY};
`

export const Center = s.div`
  text-align: center;
`
