import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import ClubTab from '../components/Settings/ClubTab'
import FavoritesTab from '../components/Settings/FavoritesTab'
import MembershipRequestsTab from '../components/Settings/MembershipRequestsTab'
import ProfileTab from '../components/Settings/ProfileTab'
import TabView from '../components/TabView'
import { BG_GRADIENT, CLUBS_BLUE, WHITE } from '../constants/colors'
import { BORDER_RADIUS } from '../constants/measurements'
import renderPage from '../renderPage'
import { UserInfo } from '../types'
import { OBJECT_NAME_TITLE } from '../utils/branding'

const Notification = styled.span`
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

type SettingsProps = {
  userInfo: UserInfo
  authenticated: boolean | null
}

type SettingsState = {
  message: ReactElement | string | null
}

class Settings extends React.Component<SettingsProps, SettingsState> {
  constructor(props) {
    super(props)
    this.state = {
      message: null,
    }
    this.notify = this.notify.bind(this)
  }

  /**
   * Display the message and scroll the user to the top of the page.
   * @param The message to show to the user.
   */
  notify(msg: ReactElement | string): void {
    this.setState(
      {
        message: msg,
      },
      () => window.scrollTo(0, 0),
    )
  }

  render() {
    const { userInfo, authenticated } = this.props
    if (authenticated === null) {
      return <div></div>
    }

    if (!userInfo) {
      return <AuthPrompt />
    }

    const { message } = this.state

    const tabs = [
      {
        name: OBJECT_NAME_TITLE,
        icon: 'peoplelogo',
        content: <ClubTab notify={this.notify} userInfo={userInfo} />,
      },
      {
        name: 'Bookmarks',
        icon: 'heart',
        content: <FavoritesTab key="bookmark" keyword="bookmark" />,
      },
      {
        name: 'Subscriptions',
        icon: 'bookmark',
        content: <FavoritesTab key="subscription" keyword="subscription" />,
      },
      {
        name: 'Requests',
        icon: 'user-check',
        content: <MembershipRequestsTab />,
      },
      {
        name: 'Profile',
        icon: 'user',
        content: <ProfileTab defaults={userInfo} />,
      },
    ]

    const { name } = this.props.userInfo

    return (
      <>
        <Metadata title="Your Profile" />
        <Container background={BG_GRADIENT}>
          <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
            Welcome, {name}
          </Title>
        </Container>
        <TabView background={BG_GRADIENT} tabs={tabs} tabClassName="is-boxed" />

        {message != null && (
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
