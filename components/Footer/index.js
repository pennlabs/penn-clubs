import s from 'styled-components'

import Social from './Social'
import { SNOW } from '../../constants/colors'
import Icon from '../common/Icon'
import { SmallText } from '../common/Typography'

const Foot = s.footer`
  height: 8rem;
  backgroundColor: ${SNOW};
  fontSize: 0.85rem;
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  align-items: center;
  padding: 4rem;
`

const Footer = () => (
  <Foot className="footer">
    <SmallText>
      Made with{' '}
      <Icon
        name="heart-red"
        alt="love"
        style={{ transform: 'translateY(2.5px)' }}
      />{' '}
      by <a href="https://pennlabs.org/">Penn Labs</a>
    </SmallText>
    <Social />
  </Foot>
)

export default Footer
