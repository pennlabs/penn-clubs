import s from 'styled-components'
import { Icon } from '../common'
import { BLACK } from '../../constants/colors'

const Icons = s.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;

  a {
    margin: 0 5px;
    color: ${BLACK}
    opacity: 0.5;

    &:hover,
    &:focus,
    &:active {
      opacity: 0.75;
    }
  }
`

export default () => (
  <Icons>
    <a href="https://github.com/pennlabs/" aria-label="GitHub">
      <Icon name="github" alt="github" />
    </a>
    <a href="https://www.facebook.com/labsatpenn/" aria-label="Facebook">
      <Icon name="facebook" alt="facebook" />
    </a>
  </Icons>
)
