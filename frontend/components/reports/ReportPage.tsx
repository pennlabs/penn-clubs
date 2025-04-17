import { useRouter } from 'next/router'
import React, { ReactElement, ReactNode } from 'react'

import { BG_GRADIENT, REPORT_LIST_ROUTE, WHITE } from '../../constants'
import { Badge, Report, Tag } from '../../types'
import { API_BASE_URL, apiCheckPermission, titleize } from '../../utils'
import { OBJECT_NAME_TITLE_SINGULAR, SITE_NAME } from '../../utils/branding'
import { Contact, Container, Icon, Metadata, Title } from '../common'
import AuthPrompt from '../common/AuthPrompt'
import ReportForm from './ReportForm'

const serializeParams = (params: { [key: string]: string }): string => {
  return new URLSearchParams(params).toString()
}

export const downloadReport = (report: Report): void => {
  window.open(
    `${API_BASE_URL}/clubs/?bypass=true&${serializeParams(
      JSON.parse(report.parameters),
    )}`,
    '_blank',
  )
}

export const ReportsPageContainer = ({
  children,
  authenticated,
  title,
  buttons,
}: React.PropsWithChildren<{
  authenticated: boolean | null
  title: ReactNode
  buttons: ReactNode
}>): ReactElement<any> => {
  const permission = apiCheckPermission('clubs.generate_reports')

  if (authenticated === false || !permission) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={!authenticated}>
        <Metadata title={`${OBJECT_NAME_TITLE_SINGULAR} Reports`} />
        <div className="mb-3">
          You do not have permission to view this page.
          {!authenticated && <> Logging in to {SITE_NAME} might help.</>}
        </div>
        <div className="mb-3">
          If you believe that you should have access to this page, please email{' '}
          <Contact />.
        </div>
      </AuthPrompt>
    )
  }

  return (
    <>
      <Metadata title={`${OBJECT_NAME_TITLE_SINGULAR} Reports`} />
      <Container background={BG_GRADIENT}>
        <div
          className="is-clearfix"
          style={{ marginTop: '2.5rem', marginBottom: '1rem' }}
        >
          <Title
            style={{
              color: WHITE,
              opacity: 0.95,
              float: 'left',
            }}
          >
            {title}
          </Title>
          {buttons}
        </div>
      </Container>
      {children}
    </>
  )
}

type EditReportPageProps = {
  nameToCode: { [cat: string]: { [key: string]: string } }
  report: Report | null
  authenticated: boolean | null
  badges: Badge[]
  tags: Tag[]
}

export const EditReportPage = ({
  nameToCode,
  report,
  authenticated,
  badges,
  tags,
}: EditReportPageProps): ReactElement<any> => {
  const fields = Object.entries(nameToCode).map(([key, value]) => [
    titleize(key),
    Object.entries(value),
  ]) as [string, [string, string][]][]
  fields.sort((a, b) => a[0].localeCompare(b[0]))

  const router = useRouter()

  const handleBack = (): void => {
    router.push(REPORT_LIST_ROUTE)
  }

  return (
    <ReportsPageContainer
      buttons={
        <button
          className="button is-link is-pulled-right"
          onClick={() => handleBack()}
        >
          <Icon name="chevrons-left" alt="back" /> Back to Reports
        </button>
      }
      title={
        report == null ? 'Create New Report' : `Edit Report: ${report.name}`
      }
      authenticated={authenticated}
    >
      <ReportForm
        badges={badges}
        tags={tags}
        fields={fields}
        onSubmit={(report: Report): void => {
          downloadReport(report)
          handleBack()
        }}
        initial={report ?? undefined}
      />
    </ReportsPageContainer>
  )
}
