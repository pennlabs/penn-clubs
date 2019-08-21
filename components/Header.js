import React from 'react'
import posed from 'react-pose'
import Head from 'next/head'
import { API_BASE_URL } from '../utils'
import { Link } from '../routes'
import { CLUBS_BLUE, CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.1 }
})

class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hoverIcon: false,
      hoverFav: false
    }
  }

  render() {
    return (
      <div>
        <Head>
          <title>Penn Clubs</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css"/>
          <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossOrigin="anonymous" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossOrigin="anonymous" />
          <script src="https://unpkg.com/ionicons@4.5.5/dist/ionicons.js" />
        </Head>
        <nav className="navbar" role="navigation" aria-label="main navigation" style={{ height: 70, backgroundColor: '#f9f9f9', borderBottom: '1px solid #fff' }}>
          <div className="navbar-brand">
            <a className="navbar-item" style={{ padding: 0 }} href="/">
              <Pop
                pose={this.state.hoverIcon ? 'hovered' : 'idle'}
                onMouseEnter={() => this.setState({ hoverIcon: true })}
                onMouseLeave={() => this.setState({ hoverIcon: false })}>
                <img src="/static/img/peoplelogo.png" style={{ paddingLeft: 15, height: '100%', marginBottom: -5 }}/>
              </Pop>
              <h1 className="title is-size-4" style={{ color: '#9B9B9B', paddingLeft: 15 }}>Penn Clubs</h1>
            </a>

            <a role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>

          <div className="navbar-menu">
            <div className="navbar-end" style={{ padding: '0px 20px' }}>
              <a href="/faq" style={{ padding: 20, textDecoration: 'underline', color: '#9B9B9B' }}>
                FAQ
              </a>
              <a href="/favorites" aria-label='Favorites' style={{ padding: 20 }}>
                <Pop
                  pose={this.state.hoverFav ? 'hovered' : 'idle'}
                  onMouseEnter={() => this.setState({ hoverFav: true })}
                  onMouseLeave={() => this.setState({ hoverFav: false })}>
                  <span className="icon" style={{ color: '#9B9B9B' }}>
                    <i className="fas fa-heart"></i>
                  </span>
                </Pop>
              </a>
              {this.props.authenticated === false && <a style={{ padding: 20, textDecoration: 'underline', color: '#9B9B9B' }} href={
                  `${API_BASE_URL}/accounts/login/?next=${window.location.href}`
              }>Login</a>}
              {this.props.userInfo && <Link route='settings'><a style={{ padding: 20, color: '#9B9B9B' }}><i className='fa fa-fw fa-user'></i> {this.props.userInfo.name || this.props.userInfo.username}</a></Link>}
            </div>
          </div>
        </nav>
      </div>
    )
  }
}

export default Header
