import { Container, Metadata, Title } from 'components/common'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { doBulkLookup } from 'utils'

import ApplicationsTable from '~/components/Settings/ApplicationsTable'
import SubmissionsPage from '~/components/Submissions'
import { BrowserTabView } from '~/components/TabView'
import { APPLY_ROUTE, BG_GRADIENT, WHITE } from '~/constants'
import { ApplicationSubmission, UserApplicationsResponse } from '~/types'

function ApplyDashboard({
  submissions,
  userApplications,
}: {
  submissions: Array<ApplicationSubmission>
  userApplications: UserApplicationsResponse | { detail: string }
}): ReactElement<any> {
  const router = useRouter()
  const tabs = [
    {
      name: 'tracker',
      label: 'Application Tracker',
      content: () => <ApplicationsTable initialData={userApplications} />,
    },
    {
      name: 'submissions',
      label: 'Submissions',
      content: () => <SubmissionsPage initialSubmissions={submissions} />,
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
  submissions: Array<ApplicationSubmission>
  userApplications: UserApplicationsResponse | { detail: string }
}

ApplyDashboard.getInitialProps = async (ctx: NextPageContext) => {
  const data: BulkResp = (await doBulkLookup(
    [
      ['submissions', '/submissions/?format=json'],
      ['userApplications', '/user-applications/?format=json'],
    ],
    ctx,
  )) as BulkResp
  return {
    ...data,
    fair: ctx.query.fair != null ? parseInt(ctx.query.fair as string) : null,
  }
}
export default renderPage(ApplyDashboard)
