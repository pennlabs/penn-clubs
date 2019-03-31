import fetch from 'isomorphic-unfetch'
import React from 'react'
import PropTypes from 'prop-types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Dropdown from '../components/Dropdown'
import SearchBar from './searchbar.js'
import ClubDisplay from './clubdisplay.js'
import ClubCard from '../components/ClubCard.js'
import Modal from '../components/Modal.js'
import { StickyContainer, Sticky } from 'react-sticky';

class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: '',
      club: {}
    }
  }

  static async getInitialProps() {
    const clubRequest = await fetch('https://clubs.pennlabs.org/clubs/?format=json')
    const clubResponse = await clubRequest.json()
    const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
    const tagsResponse = await tagsRequest.json()
    return { clubs: clubResponse, tags: tagsResponse }
  }

  componentWillMount() {
    this.setState({ clubs: this.props.clubs });
  }

  resetClubs(clubs) {
    this.setState({ clubs })
  }

  openModal(club) {
    this.setState({modal: 'is-active', club: club})
  }

  closeModal() {
    this.setState({modal: '', club: {}})
  }

  render() {
    var { clubs } = this.state
    var { tags } = this.props
    return(
      <div style={{ backgroundColor: "#f9f9f9" }}>
        <Header />
        <ClubDisplay clubs={clubs} tags={tags} openModal={this.openModal.bind(this)}/>
        <Footer />
        <SearchBar clubs={clubs} tags={tags} resetClubs={this.resetClubs.bind(this)}/>
        <Modal modal={this.state.modal} club={this.state.club} closeModal={this.closeModal.bind(this)}/>
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

export default Splash
