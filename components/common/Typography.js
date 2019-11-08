import s from 'styled-components'
import { DARK_GRAY } from '../../constants/colors'

export const Text = s.p``

export const SmallText = s.p`
  font-size: 80%;
`

export const StrongText = s.p`
  margin-bottom: 0.5rem;
  color: ${DARK_GRAY};
  font-weight: bold;
`

export const Title = ({ children }) => (
  <h1 className="title is-h1">
    <strong>{children}</strong>
  </h1>
)
