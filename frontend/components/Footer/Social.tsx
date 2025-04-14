import { ReactElement } from 'react'
import styled from 'styled-components'

import { BLACK } from '../../constants/colors'
import { Icon } from '../common'

const Icons = styled.div`
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

const Social = (): ReactElement<any> => (
  <Icons>
    <a href="https://github.com/pennlabs/" aria-label="GitHub">
      <Icon name="github" alt="github" />
    </a>
    <a href="https://www.facebook.com/labsatpenn/" aria-label="Facebook">
      <Icon name="facebook" alt="facebook" />
    </a>
  </Icons>
)

export default Social
