import { Container, Metadata, Title } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { BrowserTabView } from 'components/TabView'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { Application } from 'types'
import { doBulkLookup } from 'utils'

import WhartonApplicationTab from '~/components/Settings/WhartonApplicationTab'
import { ADMIN_ROUTE, BG_GRADIENT, WHITE } from '~/constants'

function WhartonDashboard({ userInfo, whartonapplications }): ReactElement {
  if (!userInfo) {
    return <AuthPrompt />
  }

  const router = useRouter()

  const tabs = [
    {
      name: 'whartonapplications',
      label: 'Wharton Applications',
      content: () => (
        <WhartonApplicationTab applications={whartonapplications} />
      ),
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
        route={ADMIN_ROUTE}
      />
    </>
  )
}

type BulkResp = {
  whartonapplications: Application[]
}

WhartonDashboard.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    ['whartonapplications'],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}

export default renderPage(WhartonDashboard)
