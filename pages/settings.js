import React from 'react'

import { Icon } from '../components/common'
import renderPage from '../renderPage'
import {
  doApiRequest,
  formatResponse,
  API_BASE_URL,
  ROLE_OFFICER,
} from '../utils'
import { CLUBS_GREY_LIGHT } from '../constants/colors'
import React from 'react'
import TabView from '../components/TabView'
import Form from '../components/Form'
import ClubList from '../components/ClubList'

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
            readonly: true
          }
        ]
      }
    ]

    const tabs = [
      {
        name: 'Clubs',
        content: (
          <div>
            <p>The list below shows what clubs you are a member of. If you would like to hide a particular club from the public, click on the <i className='fa fa-fw fa-check-circle has-text-success'></i> icon under the Public column. This will not hide your membership from other club members.</p>
            <table className='table is-fullwidth'>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Position</th>
                  <th>Permissions</th>
                  <th className='has-text-centered'>Active</th>
                  <th className='has-text-centered'>Public</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(userInfo && userInfo.membership_set && userInfo.membership_set.length) ? userInfo.membership_set.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.title}</td>
                    <td>{item.role_display}</td>
                    <td className='has-text-centered'>
                      <i className={item.active ? 'fa fa-check-circle has-text-success' : 'fa fa-times-circle has-text-danger'} />
                    </td>
                    <td className='has-text-centered'>
                      <i style={{ cursor: 'pointer' }} onClick={() => this.togglePublic(item)} className={item.public ? 'fa fa-check-circle has-text-success' : 'fa fa-times-circle has-text-danger'} />
                    </td>
                    <td className='buttons'>
                      <Link route='club-view' params={{ club: String(item.code) }}>
                        <a className='button is-small is-link'>View</a>
                      </Link>
                      {item.role <= ROLE_OFFICER && <Link route='club-edit' params={{ club: String(item.code) }}>
                        <a className='button is-small is-success'>Edit</a>
                      </Link>}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className='has-text-grey' colSpan='4'>
                      You are not a member of any clubs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      },
      {
        name: 'Account',
        content: (
          <Form fields={fields} defaults={this.props.userInfo} onSubmit={this.submit} />
        )
      },
      {
        name: 'Favorites',
        content: (
          <div>
            {favoriteClubs.map((club) => (
              <ClubList
                key={club.code}
                club={club}
                tags={null}
                updateFavorites={updateFavorites}
                openModal={null}
                favorite={favorites.includes(club.code)}
              />
            ))}

            {(!favorites.length) ? (
              <p className="has-text-light-grey" style={{ paddingTop: 200 }}>
                No favorites yet! Browse clubs <a href="/">here.</a>
              </p>
            ) : (<div />)}
          </div>
        )
      }
    ]

    return (
      <div style={{ padding: '30px 50px' }}>
        <h1 className='title is-size-2-desktop is-size-3-mobile'>
          <span style={{ color: CLUBS_GREY_LIGHT }}>Hello, </span>
          {this.props.userInfo.name}.
        </h1>
        <TabView tabs={tabs} />
        <a
          href={`${API_BASE_URL}/accounts/logout/?next=${window.location.href}`}
          className='button is-pulled-right is-danger is-medium'>
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
