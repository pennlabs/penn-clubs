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
import { Application, UserApplicationsResponse, UserInfo } from 'types'
import { OBJECT_NAME_TITLE, SHOW_MEMBERSHIP_REQUEST } from 'utils/branding'

import ApplicationsPage from '~/components/Applications'
import ApplicationsTab from '~/components/Settings/ApplicationsTab'
import ApplicationsTable from '~/components/Settings/ApplicationsTable'
import TicketsTab from '~/components/Settings/TicketsTab'
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
  userInfo?: UserInfo
  authenticated: boolean | null
  userApplications: UserApplicationsResponse | { detail: string }
  whartonApplications: any
}

const Settings = ({
  userInfo,
  authenticated,
  whartonApplications,
  userApplications,
}: SettingsProps) => {
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
      // the hash stays 'submissions' so existing /settings#submissions links
      // keep working
      name: 'submissions',
      label: 'My Applications',
      content: <ApplicationsTab initialData={userApplications} />,
    },
    {
      // TEMPORARY: the table alternative, side by side with the cards for
      // comparison. Delete this tab and one of the two components once a
      // direction is picked.
      name: 'submissions-table',
      label: 'My Applications (table)',
      content: <ApplicationsTable initialData={userApplications} />,
    },
    {
      name: 'applications',
      label: 'Wharton Applications',
      content: <ApplicationsPage whartonApplications={whartonApplications} />,
    },
    {
      name: 'Requests',
      icon: 'user-check',
      content: <MembershipRequestsTab />,
      disabled: !SHOW_MEMBERSHIP_REQUEST,
    },
    {
      name: 'Tickets',
      icon: 'empty_cart',
      content: <TicketsTab userInfo={userInfo} />,
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
  whartonapplications: Application[]
  userApplications: UserApplicationsResponse | { detail: string }
}

Settings.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    [
      'whartonapplications',
      ['userApplications', '/user-applications/?format=json'],
    ],
    ctx,
  )) as BulkResp

  return {
    whartonApplications: data.whartonapplications,
    userApplications: data.userApplications,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default renderPage(Settings)
