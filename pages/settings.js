import React from 'react'

import { Icon } from '../components/common'
import renderPage from '../renderPage'
import {
  doApiRequest,
  formatResponse,
  API_BASE_URL,
} from '../utils'
import { CLUBS_GREY_LIGHT, DARK_GRAY } from '../constants/colors'
import React from 'react'
import s from 'styled-components'
import TabView from '../components/TabView'
import ClubTab from '../components/Settings/ClubTab'
import FavoritesTab from '../components/Settings/FavoritesTab'
import AccountTab from '../components/Settings/AccountTab'

const Header = s.div`
  width: 470px;
  height: 72px;
  font-family: HelveticaNeue;
  font-size: 45px;
  font-weight: bold;
  color: ${DARK_GRAY};
`

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
    const {
      userInfo, authenticated, favorites, updateFavorites, favoriteClubs,
    } = this.props
    if (authenticated === null) {
      return <div></div>
    }

    if (!userInfo) {
      return (
        <div>You must be authenticated in order to use this page.</div>
      )
    }

    const { message } = this.state

    const tabs = [
      {
        name: 'Clubs',
        content: (
          <ClubTab
            togglePublic={this.togglePublic}
            userInfo={userInfo}
          />
        ),
      },
      {
        name: 'Account',
        content: (
          <AccountTab
            defaults={userInfo}
            onSubmit={this.submit}
          />
        ),
      },
      {
        name: 'Favorites',
        content: (
          <FavoritesTab
            favoriteClubs={favoriteClubs}
            favorites={favorites}
            updateFavorites={updateFavorites}
          />
        ),
      },
    ]

    return (
      <div style={{ padding: '50px 50px' }}>
        {message && (
          <div className="notification is-primary">
            <button
              className="delete"
              onClick={() => this.setState({ message: null })}
            />
            {message}
          </div>
        )}
        <Header>
          Welcome, {this.props.userInfo.name}!
        </Header>
        <TabView tabs={tabs} tabStyle='is-boxed'/>
      </div>
    )
  }
}

// <a
//   href={`${API_BASE_URL}/accounts/logout/?next=${window.location.href}`}
//   className='button is-pulled-right is-danger is-medium'>
//     Logout
// </a>

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
