import Link from 'next/link'
import { ReactElement, useState } from 'react'
import s from 'styled-components'

import { BORDER, CLUBS_NAVY, WHITE } from '../../constants/colors'
import {
  ANIMATION_DURATION,
  MD,
  mediaMaxWidth,
  NAV_HEIGHT,
} from '../../constants/measurements'
import { HOME_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import Burger from './Burger'
import Feedback from './Feedback'
import Heading from './Head'
import Links from './Links'

const Nav = s.nav`
  height: ${NAV_HEIGHT};
  background-color: ${WHITE} !important;
  border-bottom: 1px solid ${BORDER};
  box-shadow: 0 1px 4px 0 ${BORDER};
  width: 100%;
  position: fixed;
  z-index: 1001;

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
  transform: scale(1);
  transition: all ${ANIMATION_DURATION}ms ease;

  &:hover {
    transform: scale(1.1);
  }

  ${mediaMaxWidth(MD)} {
    padding-left: 1rem;
  }
`

const Title = s.h1`
  color: ${CLUBS_NAVY};
  padding-left: 15px;
  margin-bottom: 0 !important;
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
              <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />
              <Title className="title is-size-4">Penn Clubs</Title>
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
