import React, { ReactElement } from 'react'
import s from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import AuthPrompt from '../components/common/AuthPrompt'
import RenewTab from '../components/Settings/RenewTab'
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

function UserRenewal({ userInfo, authenticated }): ReactElement {
  if (authenticated === null) {
    return <div />
  }

  if (!userInfo) {
    return <AuthPrompt />
  }

  const tabs = [
    {
      name: 'Clubs',
      content: <RenewTab userInfo={userInfo} />,
    },
  ]

  const gradient = 'linear-gradient(to right, #4954f4, #44469a)'

  return (
    <>
      <Metadata title="Renew Clubs" />
      <Container background={gradient}>
        <Title style={{ marginTop: '2.5vw', color: WHITE, opacity: 0.95 }}>
          Renew Clubs
        </Title>
      </Container>
      <TabView background={gradient} tabs={tabs} tabClassName="is-boxed" />
    </>
  )
}

export default renderPage(UserRenewal)
