import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { doApiRequest, titleize } from '../utils'
import { CLUBS_GREY_LIGHT } from '../colors'
import { Link } from '../routes'
import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Form from '../components/Form'

class ClubForm extends React.Component {
  constructor(props) {
    super(props)

    this.state = {}
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
  }

  notify(msg) {
    this.setState({
      message: msg
    }, () => window.scrollTo(0, 0))
  }

  submit(data) {
    var req = null
    if (this.props.club) {
      req = doApiRequest(`/clubs/${this.props.club.id}/?format=json`, {
        method: 'PATCH',
        body: data
      })
    }
    else {
      req = doApiRequest('/clubs/?format=json', {
        method: 'POST',
        body: data
      })
    }
    req.then((resp) => {
      if (resp.ok) {
        this.notify("Club has been successfully saved.")
      }
      else {
        resp.json().then((err) => {
          this.notify(Object.keys(err).map((a) => <div key={a}><b>{titleize(a)}:</b> {err[a]}</div>))
        })
      }
    })
  }

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
            placeholder: 'Type your club description here!',
            type: 'html'
          },
          {
            name: 'tags',
            type: 'multiselect',
            placeholder: 'Select tags relevant to your club!',
            choices: tags,
            converter: (a) => ({ value: a.id, label: a.name }),
            reverser: (a) => ({ id: a.value, name: a.label })
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
          {this.state.message && <div className="notification is-primary">{this.state.message}</div>}
          <Form fields={fields} defaults={club} onSubmit={this.submit} />
          {club && <Link route='club-view' params={{ club: club.id }}>
            <a className='button is-pulled-right is-secondary is-medium'>View Club</a>
          </Link>}
        </div>
        <Footer />
      </div>
    )
  }
}

ClubForm.getInitialProps = async ({ query }) => {
  const tagsRequest = await doApiRequest('/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  const clubRequest = query.club ? await doApiRequest(`/clubs/${query.club}/?format=json`) : null
  const clubResponse = clubRequest && await clubRequest.json()
  return { club: clubResponse, tags: tagsResponse }
}


export default ClubForm
