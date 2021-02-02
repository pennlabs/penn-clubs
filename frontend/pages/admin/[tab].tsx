import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'

import { Container, Metadata, Title } from '../../components/common'
import AuthPrompt from '../../components/common/AuthPrompt'
import BulkEditTab from '../../components/Settings/BulkEditTab'
import FairEventsTab from '../../components/Settings/FairEventsTab'
import FairsTab from '../../components/Settings/FairsTab'
import QueueTab from '../../components/Settings/QueueTab'
import ReportsTab from '../../components/Settings/ReportsTab'
import ScriptsTab from '../../components/Settings/ScriptsTab'
import TabView from '../../components/TabView'
import { BG_GRADIENT, WHITE } from '../../constants'
import renderPage from '../../renderPage'
import { Badge, ClubFair, Report, Tag } from '../../types'
import { doBulkLookup } from '../../utils'

function AdminPage({
  userInfo,
  tags,
  badges,
  clubfairs,
  scripts,
  fair,
  reports,
}): ReactElement {
  const router = useRouter()

  if (!userInfo) {
    return <AuthPrompt />
  }

  const tabs = [
    {
      name: 'bulk',
      label: 'Bulk Editing',
      content: () => (
        <BulkEditTab badges={badges} clubfairs={clubfairs} tags={tags} />
      ),
    },
    {
      name: 'scripts',
      label: 'Scripts',
      content: () => <ScriptsTab scripts={scripts} />,
    },
    {
      name: 'queue',
      label: 'Approval Queue',
      content: () => <QueueTab />,
    },
    {
      name: 'fair',
      label: 'Fair Management',
      content: () => <FairsTab fairs={clubfairs} />,
    },
    {
      name: 'fairevents',
      label: 'Fair Events',
      content: () => <FairEventsTab fairs={clubfairs} fair={fair} />,
    },
    {
      name: 'reports',
      label: 'Reports',
      content: () => <ReportsTab reports={reports} authenticated={true} />,
    },
  ]

  const { tab = tabs[0].name } = router.query

  return (
    <>
      <Metadata title="Admin Dashboard" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Admin Dashboard
        </Title>
      </Container>
      <TabView
        background={BG_GRADIENT}
        tabs={tabs}
        tabClassName="is-boxed"
        useHashRouting={false}
        currentTabName={tab as string}
        onTabChange={(tab) => {
          window.history.replaceState(
            undefined,
            '',
            router.pathname.replace('[tab]', tab.name),
          )
        }}
      />
    </>
  )
}

type BulkResp = {
  tags: Tag[]
  badges: Badge[]
  clubfairs: ClubFair[]
  scripts: any[]
  reports: Report[]
}

AdminPage.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    [
      'tags',
      ['badges', '/badges/?all=true&format=json'],
      'clubfairs',
      'scripts',
      ['reports', '/reports/?format=json'],
    ],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

AdminPage.permissions = ['clubs.approve_club']

AdminPage.getAdditionalPermissions = () => ['clubs.generate_reports']

export default renderPage(AdminPage)
