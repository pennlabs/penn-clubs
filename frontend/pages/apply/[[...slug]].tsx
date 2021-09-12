import { Container, Metadata, Title } from 'components/common'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { doBulkLookup } from 'utils'

import ApplicationsPage from '~/components/Applications'
import SubmissionsPage from '~/components/submissions'
import { BrowserTabView } from '~/components/TabView'
import { APPLY_ROUTE, BG_GRADIENT, WHITE } from '~/constants'

function ApplyDashboard({ whartonapplications }): ReactElement {
  const router = useRouter()

  const tabs = [
    {
      name: 'applications',
      label: 'Applications',
      content: () => (
        <ApplicationsPage whartonapplications={whartonapplications} />
      ),
    },
    {
      name: 'submissions',
      label: 'Submissions',
      content: () => <SubmissionsPage />,
    },
  ]

  const tab = router.query.slug?.[0]

  return (
    <>
      <Metadata title="Application Dashboard" />
      <Container background={BG_GRADIENT}>
        <Title style={{ marginTop: '2.5rem', color: WHITE, opacity: 0.95 }}>
          Application Dashboard
        </Title>
      </Container>
      <BrowserTabView
        background={BG_GRADIENT}
        tabs={tabs}
        tab={tab}
        tabClassName="is-boxed"
        route={APPLY_ROUTE}
      />
    </>
  )
}

type BulkResp = {
  whartonapplications: any
}

ApplyDashboard.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    ['whartonapplications'],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}
export default renderPage(ApplyDashboard)
