import ClubFairCard from 'components/ClubEditPage/ClubFairCard'
import { Contact, Container, Metadata, Text, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import FairEventsTab from 'components/Settings/FairEventsTab'
import FairsTab from 'components/Settings/FairsTab'
import HashTabView from 'components/TabView'
import { NextPageContext } from 'next'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { MembershipRank } from 'types'
import { apiCheckPermission, doBulkLookup } from 'utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from 'utils/branding'

import { BG_GRADIENT, WHITE } from '~/constants'

function FairsPage({ userInfo, fairs, memberships }): ReactElement<any> {
  if (!userInfo) {
    return <AuthPrompt />
  }

  const canSeeFairStatus = apiCheckPermission('clubs.see_fair_status')

  const tabs = [
    {
      name: 'registration',
      label: 'Register',
      content: () => (
        <>
          <Text>
            You can use this page to register your {OBJECT_NAME_SINGULAR} for{' '}
            {OBJECT_NAME_SINGULAR} fairs. Please read the instructions carefully
            before registering any of your {OBJECT_NAME_PLURAL}.
          </Text>
          <Text>
            You will only be able to register {OBJECT_NAME_PLURAL} where you
            have at least{' '}
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()}{' '}
            permissions. If you encounter any difficulties with the registration
            process, please email <Contact />.
          </Text>
          <ClubFairCard fairs={fairs} memberships={memberships} />
        </>
      ),
    },
    {
      name: 'management',
      label: 'Management',
      content: () => <FairsTab fairs={fairs} />,
      disabled: !canSeeFairStatus,
    },
    {
      name: 'events',
      label: 'Fair Events',
      content: () => <FairEventsTab fairs={fairs} />,
      disabled: !canSeeFairStatus,
    },
  ]

  return (
    <>
      <Metadata title={`Register for ${OBJECT_NAME_TITLE_SINGULAR} Fairs`} />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Register for {OBJECT_NAME_TITLE_SINGULAR} Fairs
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

FairsPage.getInitialProps = async (ctx: NextPageContext) => {
  return doBulkLookup(
    [['fairs', '/clubfairs/?format=json'], 'memberships'],
    ctx,
  )
}

FairsPage.permissions = ['clubs.see_fair_status']

export default renderPage(FairsPage)
