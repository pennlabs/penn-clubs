import React from 'react'
import s from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import ClubTab from '../components/Settings/ClubTab'
import FavoritesTab from '../components/Settings/FavoritesTab'
import ProfileTab from '../components/Settings/ProfileTab'
import TabView from '../components/TabView'
import { CLUBS_BLUE, WHITE } from '../constants/colors'
import { BORDER_RADIUS } from '../constants/measurements'
import renderPage from '../renderPage'
import { doApiRequest, formatResponse } from '../utils'

const Notification = s.span`
  border-radius: ${BORDER_RADIUS};
  background-color: ${CLUBS_BLUE};
  color: ${WHITE};
  font-size: 16px;
  padding: 5px 10px;
  overflow-wrap: break-word;
  position: absolute;
  right: 2rem;
  margin-top: 2rem;
  padding-right: 35px;
  max-width: 50%;
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
      () => window.scrollTo(0, 0),
    )
  }

  togglePublic(club) {
    const {
      userInfo: { username },
    } = this.props
    doApiRequest(`/clubs/${club.code}/members/${username}/?format=json`, {
      method: 'PATCH',
      body: {
        public: !club.public,
      },
    }).then((resp) => {
      if (resp.ok) {
        this.notify(`Your privacy setting for ${club.name} has been changed.`)
        this.props.updateUserInfo()
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  toggleActive(club) {
    const {
      userInfo: { username },
    } = this.props
    doApiRequest(`/clubs/${club.code}/members/${username}/?format=json`, {
      method: 'PATCH',
      body: {
        active: !club.active,
      },
    }).then((resp) => {
      if (resp.ok) {
        this.notify(`Your activity setting for ${club.name} has been changed.`)
        this.props.updateUserInfo()
      } else {
        resp.json().then((err) => {
          this.notify(formatResponse(err))
        })
      }
    })
  }

  leaveClub(club) {
    const {
      userInfo: { username },
      authenticated,
    } = this.props
    if (!authenticated) {
      this.notify('You must be logged in to perform this action.')
    } else if (
      confirm(
        `Are you sure you want to leave ${club.name}? You cannot add yourself back into the club.`,
      )
    ) {
      doApiRequest(`/clubs/${club.code}/members/${username}`, {
        method: 'DELETE',
      }).then((resp) => {
        if (!resp.ok) {
          resp.json().then((err) => {
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
      userInfo,
      authenticated,
      favorites,
      updateFavorites,
      subscriptions,
      updateSubscriptions,
    } = this.props
    if (authenticated === null) {
      return <div></div>
    }

    if (!userInfo) {
      return <AuthPrompt />
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
        name: 'Bookmarks',
        icon: 'heart',
        content: (
          <FavoritesTab
            key="bookmark"
            keyword="bookmark"
            favorites={favorites}
            updateFavorites={updateFavorites}
          />
        ),
      },
      {
        name: 'Subscriptions',
        icon: 'bookmark',
        content: (
          <FavoritesTab
            key="subscription"
            keyword="subscription"
            favorites={subscriptions}
            updateFavorites={updateSubscriptions}
          />
        ),
      },
      {
        name: 'Profile',
        icon: 'user',
        content: <ProfileTab defaults={userInfo} />,
      },
    ]

    const { name } = this.props.userInfo

    const gradient = 'linear-gradient(to right, #4954f4, #44469a)'

    return (
      <>
        <Metadata title="Your Profile" />
        <Container background={gradient}>
          <Title style={{ marginTop: '2.5vw', color: WHITE, opacity: 0.95 }}>
            Welcome, {name}
          </Title>
        </Container>
        <TabView background={gradient} tabs={tabs} tabClassName="is-boxed" />

        {message && (
          <Container>
            <Notification className="notification">
              <button
                className="delete"
                onClick={() => this.setState({ message: null })}
              />
              {message}
            </Notification>
          </Container>
        )}
      </>
    )
  }
}

export default renderPage(Settings)
