import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'

import { Icon } from '../../components/common'
import {
  downloadReport,
  ReportsPageContainer,
} from '../../components/reports/ReportPage'
import ReportTable from '../../components/reports/ReportTable'
import { REPORT_CREATE_ROUTE, REPORT_EDIT_ROUTE } from '../../constants'
import renderPage from '../../renderPage'
import { Report } from '../../types'
import { doApiRequest, doBulkLookup } from '../../utils'

type ReportsProps = {
  authenticated: boolean | null
  reports: Report[]
}

const Reports = ({
  authenticated,
  reports: initialReports,
}: ReportsProps): ReactElement => {
  const [reports, setReports] = useState<Report[]>(initialReports)

  const router = useRouter()

  const reloadReports = (): void => {
    doApiRequest('/reports/?format=json')
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((data) => setReports(data))
  }

  return (
    <ReportsPageContainer
      authenticated={authenticated}
      title="Reports"
      buttons={
        <Link href={REPORT_CREATE_ROUTE}>
          <a className="button is-link is-pulled-right">
            <Icon name="plus" alt="plus" /> Create New Report
          </a>
        </Link>
      }
    >
      <ReportTable
        onRun={downloadReport}
        onEdit={(report: Report) =>
          router.push(REPORT_EDIT_ROUTE(), REPORT_EDIT_ROUTE(report.id))
        }
        onDelete={(report: Report) => {
          doApiRequest(`/reports/${report.id}/?format=json`, {
            method: 'DELETE',
          }).then(reloadReports)
        }}
        reports={reports}
      />
    </ReportsPageContainer>
  )
}

Reports.getInitialProps = async (ctx: NextPageContext) => {
  return await doBulkLookup([['reports', '/reports/?format=json']], ctx)
}

Reports.permissions = ['clubs.generate_reports']

export default renderPage(Reports)
