import React, { Component } from 'react'
import posed from 'react-pose'
import { CLUBS_GREY } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.1 },
})

class Header extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hoverIcon: false,
      hoverFav: false,
    }
  }

  render () {
    const {
      hoverIcon,
      hoverFav,
    } = this.state

    return (
      <div>
        <head>
          <title>Penn Clubs</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css" />
          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossOrigin="anonymous" />
          <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossOrigin="anonymous" />
          <script src="https://unpkg.com/ionicons@4.5.5/dist/ionicons.js" />
        </head>

        <nav
          className="navbar"
          role="navigation"
          aria-label="main navigation"
          style={{
            height: 70,
            backgroundColor: '#f9f9f9',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <div className="navbar-brand">
            <a className="navbar-item" href="/">
              <Pop
                pose={hoverIcon ? 'hovered' : 'idle'}
                onMouseEnter={() => this.setState({ hoverIcon: true })}
                onMouseLeave={() => this.setState({ hoverIcon: false })}
              >
                <img
                  alt="Penn Labs logo"
                  src="/static/img/newlogo.png"
                  style={{ paddingLeft: 15, height: '100%', marginBottom: -5 }}
                />
              </Pop>
            </a>

            <a
              role="button"
              href="/#"
              className="navbar-burger burger"
              aria-label="menu"
              aria-expanded="false"
              data-target="navbarBasicExample"
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </a>
          </div>

          <div className="navbar-menu">
            <div className="navbar-end" style={{ padding: '0px 20px' }}>
              <a href="/faq" style={{ padding: 20, textDecoration: 'underline', color: CLUBS_GREY }}>
                FAQ
              </a>
              <a href="/favorites" className="" style={{ padding: 20 }}>
                <Pop
                  pose={hoverFav ? 'hovered' : 'idle'}
                  onMouseEnter={() => this.setState({ hoverFav: true })}
                  onMouseLeave={() => this.setState({ hoverFav: false })}
                >
                  <span className="icon" style={{ color: CLUBS_GREY }}>
                    <i className="fas fa-heart" />
                  </span>
                </Pop>
              </a>
            </div>
          </div>
        </nav>
      </div>
    )
  }
}

export default Header
