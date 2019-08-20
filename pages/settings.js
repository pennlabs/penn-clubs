import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { doApiRequest, titleize, API_BASE_URL, ROLE_OFFICER } from '../utils'
import { CLUBS_GREY_LIGHT } from '../colors'
import { Link, Router } from '../routes'
import React from 'react'
import Form from '../components/Form'

class SettingsForm extends React.Component {
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
    doApiRequest('/settings/?format=json', {
      method: 'PATCH',
      body: data
    }).then((resp) => {
      if (resp.ok) {
        this.notify('Your preferences have been saved.')
      } else {
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
            type: 'text',
            readonly: true
          },
          {
            name: 'username',
            type: 'text',
            readonly: true
          },
          {
            name: 'email',
            type: 'text',
            readonly: true
          }
        ]
      },
      {
        name: 'Privacy & Notifications',
        type: 'group',
        fields: [
          {
            name: 'soon-1',
            type: 'component',
            content: <div>Coming Soon!</div>
          }
        ]
      },
      {
        name: 'Membership',
        type: 'group',
        fields: [
          {
            name: 'membership',
            type: 'component',
            content: <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {this.props.userInfo && this.props.userInfo.membership_set.map((item) => <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.title}</td>
                  <td>{item.role_display}</td>
                  <td className='buttons'>
                    <Link route='club-view' params={{ club: item.id }}>
                      <a className='button is-link'>View</a>
                    </Link>
                    {item.role <= ROLE_OFFICER && <Link route='club-edit' params={{ club: item.id }}>
                      <a className='button is-success'>Edit</a>
                    </Link>}
                  </td>
                </tr>) && <tr><td className='has-text-grey' colspan='4'>You are not a member of any clubs yet.</td></tr>}
              </tbody>
            </table>
          }
        ]
      }
    ]

    if (this.props.authenticated === null) {
      return <div></div>
    }

    if (!this.props.userInfo) {
      return <div>You must be authenticated in order to use this page.</div>
    }

    return (
      <div style={{ padding: '30px 50px' }}>
        <h1 className='title is-size-2-desktop is-size-3-mobile'><span style={{ color: CLUBS_GREY_LIGHT }}>Preferences: </span> {this.props.userInfo.username}</h1>
        {this.state.message && <div className="notification is-primary">{this.state.message}</div>}
        <Form fields={fields} defaults={this.props.userInfo} onSubmit={this.submit} />
        <a href={`${API_BASE_URL}/accounts/logout/?next=${window.location.href}`} className='button is-pulled-right is-danger is-medium'>Logout</a>
      </div>
    )
  }
}

SettingsForm.getInitialProps = async({ query }) => {
  const tagsRequest = await doApiRequest('/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  const clubRequest = query.club ? await doApiRequest(`/clubs/${query.club}/?format=json`) : null
  const clubResponse = clubRequest && await clubRequest.json()
  return { club: clubResponse, tags: tagsResponse }
}

export default renderPage(SettingsForm)
