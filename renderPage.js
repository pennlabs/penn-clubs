import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ClubModal from './components/ClubModal'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { doApiRequest } from './utils'
import fetch from 'isomorphic-fetch'
import { CLUBS_PURPLE_LIGHT } from './constants/colors'
import { logEvent } from './utils/analytics'

function renderPage(Page) {
  class RenderPage extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        authenticated: null,
        userInfo: null,
        favorites: []
      }

      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateUserInfo = this.componentDidMount.bind(this)
    }

    componentDidMount() {
      doApiRequest('/settings/?format=json').then((resp) => {
        if (resp.ok) {
          resp.json().then((data) => this.setState({
            authenticated: true,
            favorites: data.favorite_set.map((a) => a.club),
            userInfo: data
          }))
        } else {
          this.setState({
            authenticated: false,
            favorites: JSON.parse(localStorage.getItem('favorites')) || []
          })
        }
      })
      this.modalElement = document.querySelector('#modal')
    }

    render() {
      return <div style={{ dispay: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <Header authenticated={this.state.authenticated} userInfo={this.state.userInfo} />
        <Page {...this.props} {...this.state} updateFavorites={this.updateFavorites} updateUserInfo={this.updateUserInfo} />
        <Footer />
      </div>
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
              club: id
            }
          })
        }
      } else {
        newFavs.splice(i, 1)
        logEvent('unfavorite', id)
        if (this.state.authenticated) {
          doApiRequest(`/favorites/${id}/?format=json`, {
            method: 'DELETE'
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

  RenderPage.getInitialProps = async(info) => {
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
        modalClub: {}
      }
      var modalElement = null
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
      var { clubs } = this.props
      return favorites.map((favorite) => {
        return (clubs.find((club) => club.id === favorite))
      })
    }

    render() {
      var { favorites, clubs, tags } = this.props
      var { modal, modalClub } = this.state
      var favoriteClubs = this.mapToClubs(favorites)
      return (
        <div>
          <Page
            clubs={clubs}
            tags={tags}
            favorites={favorites}
            updateFavorites={this.props.updateFavorites}
            openModal={this.openModal.bind(this)}
            closeModal={this.closeModal.bind(this)}
            favoriteClubs={favoriteClubs}
          />
          <ClubModal
            modal={modal}
            club={modalClub}
            tags={tags}
            closeModal={this.closeModal.bind(this)}
            updateFavorites={this.props.updateFavorites}
            favorite={favorites.includes(modalClub.id)} />
        </div>
      )
    }
  }

  RenderListPage.getInitialProps = async() => {
    const clubRequest = await doApiRequest('/clubs/?format=json')
    const clubResponse = await clubRequest.json()
    const tagsRequest = await doApiRequest('/tags/?format=json')
    const tagsResponse = await tagsRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  return renderPage(RenderListPage)
}

export default renderPage
