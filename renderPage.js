import React from 'react'
import PropTypes from 'prop-types'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock'
import fetch from 'isomorphic-fetch'
import {
  ifElse,
  append,
  includes,
  reject,
  complement,
  map,
} from 'ramda'
import Header from './components/Header'
import Footer from './components/Footer'
import ClubModal from './components/ClubModal'

function renderPage (Page) {
  class RenderPage extends React.Component {
    constructor (props) {
      super(props)
      this.state = {
        favorites: [],
        modal: false,
        modalClub: {},
      }

      this.modalElement = null

      this.updateFavorites = this.updateFavorites.bind(this)
      this.openModal = this.openModal.bind(this)
      this.closeModal = this.closeModal.bind(this)
      this.mapToClubs = this.mapToClubs.bind(this)
    }

    componentDidMount () {
      const favorites = JSON.parse(localStorage.getItem('favorites')) || [] // eslint-disable-line no-undef
      this.setState({ favorites })
      this.modalElement = document.querySelector('#modal') // eslint-disable-line no-undef
    }

    updateFavorites (id) {
      const isEqualToId = favId => id === favId

      const { favorites } = this.state

      const getNewFavorites = ifElse(
        complement(includes(id)),
        append(id),
        reject(isEqualToId),
      )

      const newFavs = getNewFavorites(favorites)

      this.setState({ favorites: newFavs })
      localStorage.setItem('favorites', JSON.stringify(newFavs)) // eslint-disable-line no-undef
    }

    openModal (club) {
      this.setState({
        modal: true,
        modalClub: club,
      })

      disableBodyScroll(this)
    }

    closeModal () {
      this.setState({
        modal: false,
        modalClub: {},
      })

      enableBodyScroll(this)
    }

    mapToClubs (favorites) {
      const { clubs } = this.props

      const markAsFavorite = favorite => (
        clubs.find(({ id }) => id === favorite)
      )

      const toClubs = map(markAsFavorite)
      return toClubs(favorites)
    }

    render () {
      const { clubs, tags } = this.props
      const { favorites, modal, modalClub } = this.state
      const favoriteClubs = this.mapToClubs(favorites)

      return (
        <div
          style={{
            dispay: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
          }}
        >
          <Header />

          <Page
            clubs={clubs}
            tags={tags}
            favorites={favorites}
            updateFavorites={this.updateFavorites}
            openModal={this.openModal}
            closeModal={this.closeModal}
            favoriteClubs={favoriteClubs}
          />

          <Footer />

          <ClubModal
            modal={modal}
            club={modalClub}
            tags={tags}
            closeModal={this.closeModal}
            updateFavorites={this.updateFavorites}
            favorite={favorites.includes(modalClub.id)}
          />
        </div>
      )
    }
  }

  RenderPage.getInitialProps = async () => {
    const clubRequest = await fetch('https://clubs.pennlabs.org/clubs/?format=json')
    const clubResponse = await clubRequest.json()
    const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
    const tagsResponse = await tagsRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  RenderPage.propTypes = {
    clubs: PropTypes.arrayOf(PropTypes.string).isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  }

  return RenderPage
}

export default renderPage
