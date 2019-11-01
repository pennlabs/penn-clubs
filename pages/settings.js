import React from 'react'
import { BODY_FONT } from '../constants/styles'

import renderPage from '../renderPage'
import {
  doApiRequest,
  formatResponse,
} from '../utils'
import { DARK_GRAY } from '../constants/colors'
import s from 'styled-components'
import TabView from '../components/TabView'
import ClubTab from '../components/Settings/ClubTab'
import FavoritesTab from '../components/Settings/FavoritesTab'
import ProfileTab from '../components/Settings/ProfileTab'

const Header = s.div`
  width: 470px;
  height: 72px;
  font-family: ${BODY_FONT};
  font-size: 45px;
  font-weight: bold;
  color: ${DARK_GRAY};
  margin-bottom: 1rem;

`
const Notification = s.span`
  border-radius: 4px;
  background-color: #c5e7f7;
  font-size: 16px;
  font-weight: 500;
  padding: 5px;
  width: 500px;
  float: right;
  margin: 2rem;
  overflow-wrap: break-word;
`

class Settings extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.notify = this.notify.bind(this)
    this.togglePublic = this.togglePublic.bind(this)
    this.toggleActive = this.toggleActive.bind(this)
    this.leaveClub = this.leaveClub.bind(this)
    this.updateUserInfo = this.props.updateUserInfo
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

  toggleActive(club) {
    doApiRequest(
      `/clubs/${club.code}/members/${this.props.userInfo.username}/?format=json`,
      {
        method: 'PATCH',
        body: {
          active: !club.active,
        },
      }
    ).then(resp => {
      if (resp.ok) {
        this.notify(`Your activity setting for ${club.name} has been changed.`)
        this.props.updateUserInfo()
      } else {
        resp.json().then(err => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  leaveClub(club) {
    if (confirm(`Are you sure you want to leave ${club.name}? You cannot add yourself back into the club.`)) {
      doApiRequest(`/clubs/${club.code}/members/${this.props.userInfo.username}`, {
        method: 'DELETE',
      }).then(resp => {
        if (!resp.ok) {
          resp.json().then(err => {
            this.notify(formatResponse(err))
          })
        } else {
          this.notify(`You have left ${club.name}.`)
          this.updateUserInfo()
        }
      })
    }
  }

  render() {
    const {
      clubs, userInfo, authenticated, favorites, updateFavorites,
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
        icon: 'peoplelogo',
        content: (
          <ClubTab
            togglePublic={this.togglePublic}
            toggleActive={this.toggleActive}
            leaveClub={this.leaveClub}
            userInfo={userInfo}
          />
        ),
      },
      {
        name: 'Favorites',
        icon: 'heart',
        content: (
          <FavoritesTab
            clubs={clubs}
            favorites={favorites}
            updateFavorites={updateFavorites}
          />
        ),
      },
      {
        name: 'Profile',
        icon: 'user',
        content: (
          <ProfileTab
            defaults={userInfo}
          />
        ),
      },
    ]

    return (
      <div style={{ padding: 50 }}>
        <Header>
          Welcome, {this.props.userInfo.name}!
        </Header>
        <TabView tabs={tabs} tabStyle='is-boxed'/>
        {message ? (
          <Notification className="notification">
            <button
              className="delete"
              onClick={() => this.setState({ message: null })}
            />
            {message}
          </Notification>
        ) : null}
      </div>
    )
  }
}

export default renderPage(Settings)
