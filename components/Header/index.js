import React from 'react'
import s from 'styled-components'
import Heading from './Head'
import Burger from './Burger'
import Feedback from './Feedback'
import Links from './Links'
import { WHITE, CLUBS_BLUE, DARK_GRAY, ALLBIRDS_GRAY } from '../../constants/colors'

const Nav = s.nav`
  height: 3.25rem;
  background-color: ${WHITE};
  borderBottom: 1px solid ${ALLBIRDS_GRAY};
  box-shadow: 0 0 8px 0 rgba(0, 0, 0, .1);
`

const Logo = s.img`
  padding-left: 20px;
  height: 100%;
  transform: scale(1);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`

const BetaTag = s.span`
  margin-left: 10px;
  border-radius: 25px;
  background-color: ${CLUBS_BLUE};
  color: ${WHITE};
  margin-top: 2px;
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
      hoverFav: false
    }
  }

  render() {
    const { authenticated, userInfo } = this.props
    return (
      <div>
        <Heading />

        <Nav className="navbar" role="navigation" aria-label="main navigation">
          <div className="navbar-brand">
            <a className="navbar-item" style={{ padding: 0 }} href="/">
              <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />

              <Title className="title is-size-4">Penn Clubs</Title>
              <BetaTag className="tag is-info is-rounded">Beta</BetaTag>
            </a>

            <Burger />
          </div>

          <Links userInfo={userInfo} authenticated={authenticated} />
        </Nav>

        <Feedback />
      </div>
    )
  }
}

export default Header
