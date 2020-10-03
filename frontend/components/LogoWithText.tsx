import { ReactElement } from 'react'
import s from 'styled-components'

import { CLUBS_NAVY } from '../constants/colors'
import { L1, L2 } from '../constants/measurements'
import { SITE_LOGO, SITE_NAME, SITE_SUBTITLE } from '../utils/branding'

const Wrapper = s.div`
  width: 16.5rem;
  display:inline-block;
`

const Logo = s.img`
  width: 105px;
`

const TitleText = s.div`
  margin-left:15px;
  text-align: left;
  color: ${CLUBS_NAVY};
  font-size: ${L1};
  line-height: ${L1};
  font-weight: bold;
  display:inline;
  float:right;
  width:140px;
`

const SubtitleText = s.div`
  text-align: left;
  color: ${CLUBS_NAVY};
  font-size: ${L2};
  margin-bottom:2rem;
  font-style:italic;
  font-weight: semibold;
  display:inline-block;
`

const LogoWithText = (): ReactElement => {
  return (
    <Wrapper>
      <Logo src={SITE_LOGO} alt={`${SITE_NAME} Logo`} />
      <TitleText>{SITE_NAME}</TitleText>
      <SubtitleText>{SITE_SUBTITLE}</SubtitleText>
    </Wrapper>
  )
}

export default LogoWithText
