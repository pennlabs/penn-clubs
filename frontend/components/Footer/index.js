import s from 'styled-components'

import { PINK, SNOW } from '../../constants/colors'
import { Icon, SmallText } from '../common'
import Social from './Social'

const Foot = s.footer`
  height: 8rem;
  background-color: ${SNOW};
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  align-items: center;
  padding: 4rem;
`

const Footer = () => (
  <Foot className="footer">
    <SmallText style={{ marginBottom: '0rem' }}>
      Made with{' '}
      <Icon
        name="heart"
        alt="love"
        style={{
          color: PINK,
          fill: 'currentColor',
        }}
      />{' '}
      by <a href="https://pennlabs.org/">Penn Labs</a>
    </SmallText>
    <Social />
  </Foot>
)

export default Footer
