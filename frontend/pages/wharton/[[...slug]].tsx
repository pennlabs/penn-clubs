import { Container, Metadata, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { BrowserTabView } from 'components/TabView'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { Application, ApplicationStatus } from 'types'
import { doBulkLookup } from 'utils'

import WhartonApplicationCycles from '~/components/Settings/WhartonApplicationCycles'
import WhartonApplicationStatus from '~/components/Settings/WhartonApplicationStatus'
import WhartonApplicationTab from '~/components/Settings/WhartonApplicationTab'
import { BG_GRADIENT, WHARTON_ROUTE, WHITE } from '~/constants'

function WhartonDashboard({
  userInfo,
  whartonapplications,
  statuses,
}): ReactElement<any> {
  if (!userInfo) {
    return <AuthPrompt />
  }

  const router = useRouter()

  const tabs = [
    {
      name: 'application',
      label: 'Applications',
      content: () => (
        <WhartonApplicationTab applications={whartonapplications} />
      ),
    },
    {
      name: 'status',
      label: 'Status',
      content: () => <WhartonApplicationStatus statuses={statuses} />,
    },
    {
      name: 'cycle',
      label: 'Cycles',
      content: () => <WhartonApplicationCycles />,
    },
  ]

  const tab = router.query.slug?.[0]

  return (
    <>
      <Metadata title="Wharton Dashboard" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Wharton Dashboard
        </Title>
      </Container>
      <BrowserTabView
        background={BG_GRADIENT}
        tabs={tabs}
        tab={tab}
        tabClassName="is-boxed"
        route={WHARTON_ROUTE}
      />
    </>
  )
}

type BulkResp = {
  whartonapplications: Application[]
  statuses: ApplicationStatus[]
}

WhartonDashboard.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    [
      'whartonapplications',
      ['statuses', '/whartonapplications/status/?format=json'],
    ],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default renderPage(WhartonDashboard)
