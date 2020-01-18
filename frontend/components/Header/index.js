import { useState } from 'react'
import Link from 'next/link'
import s from 'styled-components'
import Heading from './Head'
import Burger from './Burger'
import Feedback from './Feedback'
import Links from './Links'
import { WHITE, CLUBS_BLUE, DARK_GRAY, BORDER } from '../../constants/colors'
import {
  NAV_HEIGHT,
  mediaMaxWidth,
  MD,
  ANIMATION_DURATION,
} from '../../constants/measurements'
import { HOME_ROUTE } from '../../constants/routes'

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

const BetaTag = s.span`
  margin-left: 10px;
  border-radius: 25px;
  background-color: ${CLUBS_BLUE} !important;
  color: ${WHITE} !important;
  margin-top: 2px;
  box-shadow: 0 0px 8px rgba(25, 89, 130, .4);
`

const Title = s.h1`
  color: ${DARK_GRAY};
  padding-left: 15px;
  margin-bottom: 0 !important;
`

const Header = ({ authenticated, userInfo }) => {
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
              <BetaTag className="tag is-rounded">Beta</BetaTag>
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
