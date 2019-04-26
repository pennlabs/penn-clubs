import React from 'react'
import fetch from 'isomorphic-unfetch'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Club = ({ club }) => console.log('club', club) || (
  <div>
    <Header />
    <Footer />
  </div>
)

Club.getInitialProps = async ({ query }) => {
  const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  const clubRequest = await fetch(`https://clubs.pennlabs.org/clubs/${query.club}/?format=json`)
  const clubResponse = await clubRequest.json()

  return {
    club: clubResponse,
    tags: tagsResponse,
  }
}

export default Club
