import { ReactElement } from 'react'
import styled from 'styled-components'

import { PINK, SNOW } from '../../constants/colors'
import { SHOW_ACCESSIBILITY } from '../../utils/branding'
import { Icon, SmallLink, SmallText } from '../common'
import Social from './Social'

const Foot = styled.footer`
  height: 8rem;
  background-color: ${SNOW};
  display: flex;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  align-items: center;
  padding: 4rem;
`

const Footer = (): ReactElement => (
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
      by <SmallLink href="https://pennlabs.org/">Penn Labs</SmallLink>
    </SmallText>
    {SHOW_ACCESSIBILITY && (
      <SmallText style={{ marginBottom: '0rem' }}>
        <SmallLink
          rel="noopener noreferrer"
          href="https://accessibility.web-resources.upenn.edu/get-help"
        >
          Report Accessibility Issues and Get Help
        </SmallLink>
      </SmallText>
    )}
    <Social />
  </Foot>
)

export default Footer
