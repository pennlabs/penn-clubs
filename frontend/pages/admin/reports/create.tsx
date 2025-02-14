import { EditReportPage } from 'components/reports/ReportPage'
import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import { Badge, Tag } from 'types'
import { doBulkLookup } from 'utils'

type CreateReportPageProps = {
  nameToCode: { [cat: string]: { [key: string]: string } }
  authenticated: boolean | null
  badges: Badge[]
  tags: Tag[]
}

const CreateReportPage = (props: CreateReportPageProps): ReactElement<any> => {
  return <EditReportPage {...props} report={null} />
}

CreateReportPage.getInitialProps = async (ctx: NextPageContext) => {
  return await doBulkLookup(
    [
      ['nameToCode', '/clubs/fields/?format=json'],
      ['badges', '/badges/?format=json'],
      ['tags', '/tags/?format=json'],
    ],
    ctx,
  )
}

CreateReportPage.permissions = ['clubs.generate_reports']

export default renderPage(CreateReportPage)
