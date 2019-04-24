import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { CLUBS_GREY } from '../colors'
import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

class Club extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    const { club, tags } = this.props
    console.log("club", club)
    return (
      <div>
       <Header />
       <Footer />
      </div>
    )
  }
}

Club.getInitialProps = async (props) => {
  const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  var { query } = props
  const clubRequest = await fetch(`https://clubs.pennlabs.org/clubs/${query.club}/?format=json`)
  const clubResponse = await clubRequest.json()
  return { club: clubResponse, tags: tagsResponse }
}



export default Club
