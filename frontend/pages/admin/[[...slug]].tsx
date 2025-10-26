import { Container, Metadata, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import BulkEditTab from 'components/Settings/BulkEditTab'
import FairEventsTab from 'components/Settings/FairEventsTab'
import FairsTab from 'components/Settings/FairsTab'
import QueueTab from 'components/Settings/QueueTab'
import ReportsTab from 'components/Settings/ReportsTab'
import ScriptsTab from 'components/Settings/ScriptsTab'
import { BrowserTabView } from 'components/TabView'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { Affiliation, ClubFair, Report, Tag, Template } from 'types'
import { apiCheckPermission, doBulkLookup } from 'utils'

import TemplatesTab from '~/components/Settings/TemplatesTab'
import { ADMIN_ROUTE, BG_GRADIENT, WHITE } from '~/constants'

function AdminPage({
  userInfo,
  tags,
  affiliations,
  templates,
  clubfairs,
  scripts,
  fair,
  reports,
}): ReactElement<any> {
  if (!userInfo) {
    return <AuthPrompt />
  } else if (
    !apiCheckPermission(['clubs.approve_club', 'clubs.generate_reports']) &&
    !userInfo.is_superuser
  ) {
    return (
      <AuthPrompt title="Whoops!" hasLogin={false}>
        Admin permissions are required to access this page.
      </AuthPrompt>
    )
  }

  const router = useRouter()

  const tabs = [
    {
      name: 'bulk',
      label: 'Club Management',
      content: () => (
        <BulkEditTab
          affiliations={affiliations}
          clubfairs={clubfairs}
          tags={tags}
        />
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
      name: 'templates',
      label: 'Approval Templates',
      content: () => <TemplatesTab templates={templates} />,
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
      content: () => <ReportsTab reports={reports} />,
    },
  ]

  const tab = router.query.slug?.[0]

  return (
    <>
      <Metadata title="Admin Dashboard" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Admin Dashboard
        </Title>
      </Container>
      <BrowserTabView
        background={BG_GRADIENT}
        tabs={tabs}
        tab={tab}
        tabClassName="is-boxed"
        route={ADMIN_ROUTE}
      />
    </>
  )
}

type BulkResp = {
  tags: Tag[]
  affiliations: Affiliation[]
  templates: Template[]
  clubfairs: ClubFair[]
  scripts: any[]
  reports: Report[]
}

AdminPage.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    [
      'tags',
      ['affiliations', '/badges/?all=true&format=json'],
      'templates',
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

AdminPage.permissions = ['clubs.approve_club', 'clubs.generate_reports']

export default renderPage(AdminPage)
