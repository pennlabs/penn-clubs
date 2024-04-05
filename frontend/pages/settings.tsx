import { Container, Metadata, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import ClubTab from 'components/Settings/ClubTab'
import FavoritesTab from 'components/Settings/FavoritesTab'
import MembershipRequestsTab from 'components/Settings/MembershipRequestsTab'
import ProfileTab from 'components/Settings/ProfileTab'
import HashTabView from 'components/TabView'
import { NextPageContext } from 'next'
import React, { ReactNode } from 'react'
import { toast, TypeOptions } from 'react-toastify'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { ApplicationSubmission, UserInfo } from 'types'
import { OBJECT_NAME_TITLE, SHOW_MEMBERSHIP_REQUEST } from 'utils/branding'

import SubmissionsPage from '~/components/Submissions'
import { BG_GRADIENT, CLUBS_BLUE, WHITE } from '~/constants/colors'
import { BORDER_RADIUS } from '~/constants/measurements'
import { doBulkLookup } from '~/utils'

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
  submissions: ApplicationSubmission[]
}

const Settings = ({ userInfo, authenticated, submissions }) => {
  /**
   * Display the message to the user in the form of a toast.
   * @param The message to show to the user.
   */
  const notify = (msg: ReactNode, type: TypeOptions = 'info'): void => {
    toast[type](msg)
  }

  if (authenticated === null) {
    return <div></div>
  }

  if (!userInfo) {
    return <AuthPrompt />
  }

  const tabs = [
    {
      name: OBJECT_NAME_TITLE,
      icon: 'peoplelogo',
      content: <ClubTab notify={notify} userInfo={userInfo} />,
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
      name: 'submissions',
      label: 'Submissions',
      content: () => <SubmissionsPage initialSubmissions={submissions} />,
    },
    {
      name: 'Requests',
      icon: 'user-check',
      content: <MembershipRequestsTab />,
      disabled: !SHOW_MEMBERSHIP_REQUEST,
    },
    {
      name: 'Profile',
      icon: 'user',
      content: <ProfileTab defaults={userInfo} />,
    },
  ]

  return (
    <>
      <Metadata title="Your Profile" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Welcome, {userInfo.name || userInfo.username}
        </Title>
      </Container>
      <HashTabView
        background={BG_GRADIENT}
        tabs={tabs}
        tabClassName="is-boxed"
      />
    </>
  )
}

type BulkResp = {
  submissions: Array<ApplicationSubmission>
}

Settings.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    ['submissions', '/submissions/?format=json'],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default renderPage(Settings)
