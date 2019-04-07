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
      favorites: []
    }
  }

  componentDidMount() {
    var favorites = localStorage.getItem('favorites')
    this.setState({ favorites })
  }

  render() {
    var { favorites } = this.state
    return (
      <div style={{ backgroundColor: "#f9f9f9" }}>
        <Header />

        <Footer />
      </div>
    );
  }
}

export default Favorites
