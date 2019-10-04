import React from 'react'
import s from 'styled-components'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'

import Header from './components/Header'
import Footer from './components/Footer'
import ClubModal from './components/ClubModal'

import { WHITE } from './constants/colors'
import { doApiRequest } from './utils'
import { logEvent } from './utils/analytics'
import { logException } from './utils/sentry'

const Wrapper = s.div`
  min-height: calc(100vh);
`

function renderPage(Page) {
  class RenderPage extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        authenticated: null,
        userInfo: null,
        favorites: [],
      }

      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateUserInfo = this.componentDidMount.bind(this)
    }

    componentDidMount() {
      doApiRequest('/settings/?format=json').then(resp => {
        if (resp.ok) {
          resp.json().then(data =>
            this.setState({
              authenticated: true,
              favorites: data.favorite_set.map(a => a.club),
              userInfo: data,
            })
          )
        } else {
          this.setState({
            authenticated: false,
            favorites: JSON.parse(localStorage.getItem('favorites')) || [],
          })
        }
      })
    }

    render() {
      try {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: WHITE,
            }}
          >
            <Header
              authenticated={this.state.authenticated}
              userInfo={this.state.userInfo}
            />
            <Wrapper>
              <Page
                {...this.props}
                {...this.state}
                updateFavorites={this.updateFavorites}
                updateUserInfo={this.updateUserInfo}
              />
            </Wrapper>
            <Footer />
          </div>
        )
      } catch (ex) {
        logException(ex)
      }
    }

    updateFavorites(id) {
      var newFavs = this.state.favorites
      var i = newFavs.indexOf(id)
      if (i === -1) {
        newFavs.push(id)
        if (this.state.authenticated) {
          logEvent('favorite', id)
          doApiRequest('/favorites/?format=json', {
            method: 'POST',
            body: {
              club: id,
            },
          })
        }
      } else {
        newFavs.splice(i, 1)
        logEvent('unfavorite', id)
        if (this.state.authenticated) {
          doApiRequest(`/favorites/${id}/?format=json`, {
            method: 'DELETE',
          })
        }
      }
      this.setState({ favorites: newFavs })
      if (!this.state.authenticated) {
        localStorage.setItem('favorites', JSON.stringify(newFavs))
      }
      return i === -1
    }
  }

  RenderPage.getInitialProps = async info => {
    if (Page.getInitialProps) {
      return Page.getInitialProps(info)
    }
    return {}
  }

  return RenderPage
}

export function renderListPage(Page) {
  class RenderListPage extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        modal: false,
        clubs: props.clubs,
        tags: props.tags,
        modalClub: {},
      }
    }

    componentDidMount() {
      doApiRequest('/clubs/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ clubs: data }))
      doApiRequest('/tags/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ tags: data }))
    }

    openModal(club) {
      logEvent('openModal', club.name)
      this.setState({ modal: true, modalClub: club })
      disableBodyScroll(this)
    }

    closeModal(club) {
      this.setState({ modal: false, modalClub: {} })
      enableBodyScroll(this)
    }

    mapToClubs(favorites) {
      const { clubs } = this.state
      if (!clubs || !clubs.length) return []

      return favorites.map(favorite => {
        return clubs.find(club => club.code === favorite)
      })
    }

    render() {
      const { favorites } = this.props
      const { modal, modalClub, clubs, tags } = this.state

      if (clubs === null || tags === null) {
        return (
          <div
            className="has-text-centered"
            style={{ margin: '25vh 0', opacity: 0.25 }}
          >
            <div className="fa-3x">
              <i className="fas fa-spinner fa-pulse" />
              <br />
              <p className="title is-5">Loading...</p>
            </div>
          </div>
        )
      }

      const favoriteClubs = this.mapToClubs(favorites)

      return (
        <>
          <ClubModal
            modal={modal}
            club={modalClub}
            tags={tags}
            closeModal={this.closeModal.bind(this)}
            updateFavorites={this.props.updateFavorites}
            favorite={favorites.includes(modalClub.id)}
          />
          <Page
            clubs={clubs}
            tags={tags}
            favorites={favorites}
            updateFavorites={this.props.updateFavorites}
            openModal={this.openModal.bind(this)}
            closeModal={this.closeModal.bind(this)}
            favoriteClubs={favoriteClubs}
          />
        </>
      )
    }
  }

  RenderListPage.getInitialProps = async () => {
    return { clubs: null, tags: null }
  }

  return renderPage(RenderListPage)
}

export default renderPage
