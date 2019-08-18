import React from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ClubModal from './components/ClubModal'
import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'
import { getApiBaseURL } from './utils'
import fetch from 'isomorphic-fetch'
import { CLUBS_PURPLE_LIGHT } from './colors'


function renderPage(Page) {
  class RenderPage extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        favorites: [],
        modal: false,
        modalClub: {}
      }
      var modalElement = null
    }

    componentDidMount() {
      var favorites = JSON.parse(localStorage.getItem('favorites')) || []
      this.setState({ favorites })
      this.modalElement = document.querySelector('#modal');
    }

    updateFavorites(id) {
      var newFavs = this.state.favorites
      var i = newFavs.indexOf(id)
      if (i == -1) {
        newFavs.push(id)
        fetch(`${getApiBaseURL()}/favorites/?format=json`, {
          method: 'POST',
          data: {
            club: id
          }
        })
      } else {
        newFavs.splice(i, 1)
        fetch(`${getApiBaseURL()}/favorites/${id}/?format=json`, {
          method: 'DELETE'
        })
      }
      localStorage.setItem('favorites', JSON.stringify(newFavs))

      this.setState({favorites: newFavs})
    }

    openModal(club) {
      this.state.favorites.includes(club.id)
      this.setState({modal: true, modalClub: club})
      disableBodyScroll(this)
    }

    closeModal(club) {
      this.setState({modal: false, modalClub: {}})
      enableBodyScroll(this)
    }

    mapToClubs(favorites) {
      var { clubs } = this.props
      return favorites.map((favorite) => {
        return (clubs.find((club) => club.id == favorite))
      })
    }

    render() {
      var { clubs, tags } = this.props
      var { favorites, modal, modalClub } = this.state
      var favoriteClubs = this.mapToClubs(favorites)
      return(
        <div style={{ dispay: "flex", flexDirection: "column", backgroundColor: "#fff"}}>
            <Header />
            <Page
              clubs={clubs}
              tags={tags}
              favorites={favorites}
              updateFavorites={this.updateFavorites.bind(this)}
              openModal={this.openModal.bind(this)}
              closeModal={this.closeModal.bind(this)}
              favoriteClubs={favoriteClubs}
            />
            <Footer />
            <ClubModal
              modal={modal}
              club={modalClub}
              tags={tags}
              closeModal={this.closeModal.bind(this)}
              updateFavorites={this.updateFavorites.bind(this)}
              favorite={favorites.includes(modalClub.id)} />
          </div>
      )
    }
  }

  RenderPage.getInitialProps = async () => {
    const clubRequest = await fetch(`${getApiBaseURL()}/clubs/?format=json`)
    const clubResponse = await clubRequest.json()
    const tagsRequest = await fetch(`${getApiBaseURL()}/tags/?format=json`)
    const tagsResponse = await tagsRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  return RenderPage

}

export default renderPage
