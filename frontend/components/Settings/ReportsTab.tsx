import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'

import { REPORT_CREATE_ROUTE, REPORT_EDIT_ROUTE } from '../../constants'
import { Report } from '../../types'
import { doApiRequest } from '../../utils'
import { Icon } from '../common'
import { downloadReport } from '../reports/ReportPage'
import ReportTable from '../reports/ReportTable'

type ReportsProps = {
  authenticated: boolean | null
  reports: Report[]
}

const ReportsTab = ({
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
    <>
      <Link href={REPORT_CREATE_ROUTE}>
        <a className="button is-link">
          <Icon name="plus" alt="plus" /> Create New Report
        </a>
      </Link>
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
    </>
  )
}

export default ReportsTab
