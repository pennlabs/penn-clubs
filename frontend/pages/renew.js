import React from 'react'
import s from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import ClubTab from '../components/Settings/ClubTab'
import RenewTab from '../components/Settings/RenewTab'
import FavoritesTab from '../components/Settings/FavoritesTab'
import ProfileTab from '../components/Settings/ProfileTab'
import TabView from '../components/TabView'
import { CLUBS_BLUE, WHITE } from '../constants/colors'
import { BORDER_RADIUS } from '../constants/measurements'
import renderPage from '../renderPage'

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

class UserRenewal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
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
        name: 'Clubs',
        icon: 'peoplelogo',
        content: <RenewTab notify={this.notify} userInfo={userInfo} />,
      }
    ]

    const { name } = this.props.userInfo

    const gradient = 'linear-gradient(to right, #4954f4, #44469a)'

    return (
      <>
        <Metadata title="Your Profile" />
        <Container background={gradient}>
          <Title style={{ marginTop: '2.5vw', color: WHITE, opacity: 0.95 }}>
            Register Clubs
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

export default renderPage(UserRenewal)
