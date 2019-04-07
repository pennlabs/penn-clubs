import React from 'react'
import Select from 'react-select'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Modal from '../components/Modal.js'
import PropTypes from 'prop-types'


class Favorites extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  componentWillMount() {
    var {  } = this.props
    this.setState({ clubs, favorites });
  }

  render() {
    var { clubs } = this.state
    var { tags } = this.props
    return(
      <div style={{ backgroundColor: "#f9f9f9" }}>
        <Header />

        <Footer />
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

export default Splash
