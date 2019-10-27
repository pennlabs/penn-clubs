import Icon from '../components/common/Icon'
import renderPage from '../renderPage.js'
import {
  doApiRequest,
  formatResponse,
  API_BASE_URL,
  ROLE_OFFICER,
} from '../utils'
import { CLUBS_GREY_LIGHT } from '../constants/colors'
import { Link } from '../routes'
import React from 'react'
import Form from '../components/Form'

class SettingsForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.submit = this.submit.bind(this)
    this.notify = this.notify.bind(this)
  }

  /**
   * @param {string} msg
   */
  notify(msg) {
    // Display the message and scroll the user to the top of the page
    this.setState(
      {
        message: msg,
      },
      () => window.scrollTo(0, 0)
    )
  }

  submit(data) {
    doApiRequest('/settings/?format=json', {
      method: 'PATCH',
      body: data,
    }).then(resp => {
      if (resp.ok) {
        this.notify('Your preferences have been saved.')
      } else {
        resp.json().then(err => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  togglePublic(club) {
    doApiRequest(
      `/clubs/${club.code}/members/${this.props.userInfo.username}/?format=json`,
      {
        method: 'PATCH',
        body: {
          public: !club.public,
        },
      }
    ).then(resp => {
      if (resp.ok) {
        this.notify(`Your privacy setting for ${club.name} has been changed.`)
        this.props.updateUserInfo()
      } else {
        resp.json().then(err => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  render() {
    const { userInfo, authenticated } = this.props
    const isMembershipSet = Boolean(
      userInfo && userInfo.membership_set && userInfo.membership_set.length
    )
    const fields = [
      {
        name: 'General',
        type: 'group',
        fields: [
          {
            name: 'name',
            type: 'text',
            readonly: true,
          },
          {
            name: 'username',
            type: 'text',
            readonly: true,
          },
          {
            name: 'email',
            label: 'Primary Email',
            type: 'text',
            readonly: true,
          },
        ],
      },
      {
        name: 'Membership',
        type: 'group',
        fields: [
          {
            name: 'membership',
            type: 'component',
            content: (
              <div>
                <p>
                  The list below shows what clubs you are a member of. If you
                  would like to hide a particular club from the public, click on
                  the <Icon name="check-circle-green" alt="public" /> icon under
                  the Public column. This will not hide your membership from
                  other club members.
                </p>
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                      <th>Permissions</th>
                      <th className="has-text-centered">Active</th>
                      <th className="has-text-centered">Public</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isMembershipSet ? (
                      userInfo.membership_set.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.title}</td>
                          <td>{item.role_display}</td>
                          <td className="has-text-centered">
                            <Icon
                              name={
                                item.active
                                  ? 'check-circle-green'
                                  : 'x-circle-red'
                              }
                              alt={item.active ? 'active' : 'inactive'}
                            />
                          </td>
                          <td className="has-text-centered">
                            <Icon
                              name={
                                item.public
                                  ? 'check-circle-green'
                                  : 'x-circle-red'
                              }
                              alt={item.public ? 'public' : 'not public'}
                            />
                          </td>
                          <td className="buttons">
                            <Link
                              route="club-view"
                              params={{ club: String(item.code) }}
                            >
                              <a className="button is-small is-link">View</a>
                            </Link>
                            {item.role <= ROLE_OFFICER && (
                              <Link
                                route="club-edit"
                                params={{ club: String(item.code) }}
                              >
                                <a className="button is-small is-success">
                                  Edit
                                </a>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="has-text-grey" colSpan="4">
                          You are not a member of any clubs yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ),
          },
        ],
      },
    ]

    if (authenticated === null) {
      return <div></div>
    }

    if (!userInfo) {
      return <div>You must be authenticated in order to use this page.</div>
    }

    const { message } = this.state

    return (
      <div style={{ padding: '30px 50px' }}>
        <h1 className="title is-size-2-desktop is-size-3-mobile">
          <span style={{ color: CLUBS_GREY_LIGHT }}>Preferences: </span>
          {this.props.userInfo.username}
        </h1>

        {message && (
          <div className="notification is-primary">
            <button
              className="delete"
              onClick={() => this.setState({ message: null })}
            />
            {message}
          </div>
        )}
        <Form
          fields={fields}
          defaults={this.props.userInfo}
          onSubmit={this.submit}
        />
        <a
          href={`${API_BASE_URL}/accounts/logout/?next=${window.location.href}`}
          className="button is-pulled-right is-danger is-medium"
        >
          Logout
        </a>
      </div>
    )
  }
}

SettingsForm.getInitialProps = async ({ query }) => {
  const tagsRequest = await doApiRequest('/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  const clubRequest = query.club
    ? await doApiRequest(`/clubs/${query.club}/?format=json`)
    : null
  const clubResponse = clubRequest && (await clubRequest.json())
  return { club: clubResponse, tags: tagsResponse }
}

export default renderPage(SettingsForm)
