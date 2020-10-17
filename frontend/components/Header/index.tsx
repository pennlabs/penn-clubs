import Link from 'next/link'
import { ReactElement, useState } from 'react'
import s from 'styled-components'

import { BANNER_BG, BANNER_TEXT, BORDER } from '../../constants/colors'
import {
  ANIMATION_DURATION,
  LOGO_SCALE,
  MD,
  mediaMaxWidth,
  NAV_HEIGHT,
  TITLE_MARGIN,
  TITLE_SIZE,
  TITLE_WEIGHT,
} from '../../constants/measurements'
import { HOME_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import { SITE_LOGO, SITE_NAME } from '../../utils/branding'
import Burger from './Burger'
import Feedback from './Feedback'
import Heading from './Head'
import Links from './Links'

const Nav = s.nav`
  height: ${NAV_HEIGHT};
  background-color: ${BANNER_BG} !important;
  border-bottom: 1px solid ${BORDER};
  box-shadow: 0 1px 4px 0 ${BORDER};
  width: 100%;
  position: fixed;
  z-index: 1001;
  box-shadow: 2px 0px 5px black;

  ${mediaMaxWidth(MD)} {
    box-shadow: none;
  }
`

const NavSpacer = s.div`
  width: 100%;
  display: block;
  height: ${NAV_HEIGHT};
`

const Logo = s.img`
  padding-left: 20px;
  height: 100%;
  transform: scale(${LOGO_SCALE});
  transition: all ${ANIMATION_DURATION}ms ease;

  &:hover {
    transform: scale(1.1);
  }

  ${mediaMaxWidth(MD)} {
    padding-left: 1rem;
  }
`

const Title = s.h1`
  color: ${BANNER_TEXT};
  padding-left: ${TITLE_MARGIN};
  margin-bottom: 0 !important;
  font-size: ${TITLE_SIZE};
  font-weight: ${TITLE_WEIGHT};
`

type HeaderProps = {
  authenticated: boolean | null
  userInfo?: UserInfo
}

const Header = ({ authenticated, userInfo }: HeaderProps): ReactElement => {
  const [show, setShow] = useState(false)

  const toggle = () => setShow(!show)

  return (
    <>
      <Heading />

      <NavSpacer />

      <Nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link href={HOME_ROUTE}>
            <a className="navbar-item" style={{ padding: 0 }}>
              <Logo src={SITE_LOGO} alt={`${SITE_NAME} Logo`} />
              <Title>{SITE_NAME}</Title>
            </a>
          </Link>

          <Burger toggle={toggle} />
        </div>

        <Links userInfo={userInfo} authenticated={authenticated} show={show} />
      </Nav>

      <Feedback />
    </>
  )
}

export default Header
