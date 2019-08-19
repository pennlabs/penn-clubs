import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { doApiRequest } from '../utils'
import { CLUBS_GREY_LIGHT } from '../colors'
import { Link } from '../routes'
import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Form from '../components/Form'

class Club extends React.Component {
  render() {
    const { club, tags } = this.props
    const fields = [
      {
        name: 'General',
        type: 'group',
        fields: [
          {
            name: 'name',
            type: 'text'
          },
          {
            name: 'subtitle',
            type: 'text'
          },
          {
            name: 'description',
            type: 'html'
          }
        ]
      },
      {
        name: 'Contact',
        type: 'group',
        fields: [
          {
            name: 'email',
            type: 'email'
          },
          {
            name: 'facebook',
            type: 'url'
          },
          {
            name: 'twitter',
            type: 'url'
          },
          {
            name: 'instagram',
            type: 'url'
          },
          {
            name: 'linkedin',
            type: 'url'
          }
        ]
      },
      {
        name: 'Admission',
        type: 'group',
        fields: [
          {
            name: 'how_to_get_involved',
            type: 'textarea'
          }
        ]
      }
    ]

    return (
      <div>
        <Header />
        <div style={{padding: "30px 50px"}}>
          <h1 className='title is-size-2-desktop is-size-3-mobile'><span style={{ color: CLUBS_GREY_LIGHT }}>{club ? 'Editing' : 'Creating'} Club: </span> {club ? club.name : 'New Club'}</h1>
          <Form fields={fields} defaults={club} />
          <a className='button is-primary is-medium'>Save Club</a>
          {club && <Link route='club-view' params={{ club: club.id }}>
            <a className='button is-pulled-right is-secondary is-medium'>View Club</a>
          </Link>}
        </div>
        <Footer />
      </div>
    )
  }
}

Club.getInitialProps = async ({ query }) => {
  const tagsRequest = await doApiRequest('/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  const clubRequest = query.club ? await doApiRequest(`/clubs/${query.club}/?format=json`) : null
  const clubResponse = clubRequest && await clubRequest.json()
  return { club: clubResponse, tags: tagsResponse }
}


export default Club
