import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'

import { REPORT_CREATE_ROUTE, REPORT_EDIT_ROUTE } from '../../constants'
import { Report } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import { SITE_NAME } from '../../utils/branding'
import { Icon, Text } from '../common'
import { downloadReport } from '../reports/ReportPage'
import ReportTable from '../reports/ReportTable'

type ReportsProps = {
  reports: Report[]
}

const ReportsTab = ({
  reports: initialReports,
}: ReportsProps): ReactElement => {
  const [reports, setReports] = useState<Report[]>(initialReports ?? [])
  const permission = apiCheckPermission('clubs.generate_reports')

  const router = useRouter()

  const reloadReports = (): void => {
    doApiRequest('/reports/?format=json')
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((data) => setReports(data))
  }

  if (!permission) {
    return <Text>You do not have permission to view this page.</Text>
  }

  return (
    <>
      <Text>
        You can use this page to generate Excel spreadsheet exports from the{' '}
        {SITE_NAME} database.
      </Text>
      <div className="buttons">
        <Link href={REPORT_CREATE_ROUTE} className="button is-link is-small">
          <Icon name="plus" alt="plus" />
          Create New Report
        </Link>
      </div>
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
