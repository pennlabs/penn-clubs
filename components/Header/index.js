import React from 'react'
import s from 'styled-components'
import Heading from './Head'
import Burger from './Burger'
import Feedback from './Feedback'
import Links from './Links'
import { WHITE, CLUBS_BLUE, DARK_GRAY, ALLBIRDS_GRAY } from '../../constants/colors'
import { NAV_HEIGHT, mediaMaxWidth, MD } from '../../constants/measurements'

const Nav = s.nav`
  height: ${NAV_HEIGHT};
  background-color: ${WHITE} !important;
  borderBottom: 1px solid ${ALLBIRDS_GRAY};
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, .1);
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
  transition: all 0.2s ease;

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

class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false
    }
    this.toggleLinks = this.toggleLinks.bind(this)
  }

  toggleLinks() {
    const { show } = this.state
    this.setState({ show: !show })
  }

  render() {
    const { authenticated, userInfo } = this.props
    const { show } = this.state
    return (
      <>
        <Heading />

        <NavSpacer />

        <Nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <a className="navbar-item" style={{ padding: 0 }} href="/">
              <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />

              <Title className="title is-size-4">Penn Clubs</Title>
              <BetaTag className="tag is-rounded">Beta</BetaTag>
            </a>

            <Burger toggle={this.toggleLinks} />
          </div>

          <Links
            userInfo={userInfo}
            authenticated={authenticated}
            show={show}
          />
        </Nav>

        <Feedback />
      </>
    )
  }
}

export default Header
