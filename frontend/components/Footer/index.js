import s from 'styled-components'

import Social from './Social'
import { SNOW } from '../../constants/colors'
import { Icon, SmallText } from '../common'

const Foot = s.footer`
  height: 8rem;
  background-color: ${SNOW};
  font-size: 0.85rem;
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
        name="heart"
        alt="love"
        style={{
          transform: 'translateY(2.5px)',
          color: '#e25152',
          fill: 'currentColor',
        }}
      />{' '}
      by <a href="https://pennlabs.org/">Penn Labs</a>
    </SmallText>
    <Social />
  </Foot>
)

export default Footer
