import fetch from 'isomorphic-unfetch'
import React from 'react'
import PropTypes from 'prop-types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchBar from './searchbar.js'
import ClubDisplay from './clubdisplay.js'
import ClubCard from '../components/ClubCard.js'
import Modal from '../components/Modal.js'


class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: '',
      club: {},
      favorites: []
    }
  }

  static async getInitialProps() {
    const clubRequest = await fetch('https://clubs.pennlabs.org/clubs/?format=json')
    const clubResponse = await clubRequest.json()
    const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
    const tagsResponse = await tagsRequest.json()
    //TODO
    // const favoritesRequest = await fetch('')
    // const favoritesResponse = await favoritesRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  componentDidMount() {
    var favorites = localStorage.getItem('favorites') || []
    this.setState({ favorites });
  }

  componentWillMount() {
    var { clubs } = this.props
    this.setState({ clubs });
  }

  componentDidUpdate() {
    localStorage.setItem('favorites', this.state.favorites);
  }

  resetClubs(clubs) {
    this.setState({ clubs })
  }

  openModal(club) {
    this.setState({modal: 'is-active', club: club})
  }

  closeModal(club) {
    this.setState({modal: '', club: club})
  }

  toggleFavorite(club) {
    var newFavs = this.state.favorites
    var i = newFavs.indexOf(club);
    if (i == -1) {
      newFavs.push(club)
    } else {
      newFavs.splice(i, 1)
    }
    localStorage.setItem('favorites', newFavs)
    this.setState({favorites: newFavs})
  }

  isFavorite(club) {
    return this.state.favorites.indexOf(club) != -1;
  }

  render() {
    var { clubs } = this.state
    var { tags } = this.props
    console.log(clubs, tags)
    return(
      <div style={{ backgroundColor: "#f9f9f9" }}>
        <Header />
        <ClubDisplay
          clubs={clubs}
          tags={tags}
          openModal={this.openModal.bind(this)}
          toggleFavorite={this.toggleFavorite.bind(this)}
          isFavorite={this.isFavorite.bind(this)}/>
        <Footer />
        <SearchBar
          clubs={clubs}
          tags={tags}
          resetClubs={this.resetClubs.bind(this)}/>
        <Modal
          modal={this.state.modal}
          club={this.state.club}
          closeModal={this.closeModal.bind(this)}
          toggleFavorite={this.toggleFavorite.bind(this)}
          isFavorite={this.isFavorite.bind(this)}/>
      </div>
    );
  }
}

Splash.propTypes = {
  clubs: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    founded: PropTypes.string.isRequired,
    facts: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    facebook: PropTypes.string.isRequired,
    tags: PropTypes.array.isRequired,
    application_required: PropTypes.bool.isRequired,
    accepting_applications: PropTypes.bool.isRequired,
    image_url: PropTypes.string.isRequired,
  }).isRequired,
  tags: PropTypes.shape({
    name: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
  }).isRequired,
}

export default Splash;
