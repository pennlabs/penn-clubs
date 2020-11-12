import { NextPageContext } from 'next'
import { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import {
  Contact,
  Container,
  Empty,
  Icon,
  Metadata,
  Title,
} from '../../components/common'
import AuthPrompt from '../../components/common/AuthPrompt'
import ReportForm from '../../components/reports/ReportForm'
import {
  BG_GRADIENT,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  LIGHT_GRAY,
  WHITE,
} from '../../constants/colors'
import renderPage from '../../renderPage'
import { Badge, Report } from '../../types'
import { API_BASE_URL, apiCheckPermission, doApiRequest } from '../../utils'
import { OBJECT_NAME_TITLE_SINGULAR, SITE_NAME } from '../../utils/branding'

const TableHeader = styled.th`
  font-weight: 550;
  color: ${CLUBS_GREY};
`

const TableData = styled.td`
  color: ${CLUBS_GREY_LIGHT};
  line-height: 1.4em;
  vertical-align: middle;
  padding: 0;
`

const TableHeadDivider = styled.thead`
  width: 1px;
  border-bottom: 1px solid ${LIGHT_GRAY};
`

const serializeParams = (params: { [key: string]: string }): string => {
  return new URLSearchParams(params).toString()
}

type ReportsProps = {
  nameToCode: { [key: string]: string }
  authenticated: boolean | null
  badges: Badge[]
}

const Reports = ({
  nameToCode,
  authenticated,
  badges,
}: ReportsProps): ReactElement => {
  const fields = {
    Fields: Object.entries(nameToCode),
  }

  const [reports, setReports] = useState<Report[]>([])
  const permission = apiCheckPermission('clubs.generate_reports')

  const [isEdit, setIsEdit] = useState<Report | boolean>(false)

  const reloadReports = (): void => {
    doApiRequest('/reports/?format=json')
      .then((resp) => (resp.ok ? resp.json() : []))
      .then((data) => setReports(data))
  }

  useEffect(reloadReports, [])

  const handleBack = (): void => {
    reloadReports()
    setIsEdit(false)
  }

  const handleDownload = (report: Report): void => {
    window.open(
      `${API_BASE_URL}/clubs/?bypass=true&${serializeParams(
        JSON.parse(report.parameters),
      )}`,
      '_blank',
    )
  }

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
            {isEdit
              ? isEdit === true
                ? 'Create New Report'
                : `Edit Report: ${isEdit.name}`
              : 'Reports'}
          </Title>
          {isEdit ? (
            <button
              className="button is-link is-pulled-right"
              onClick={() => handleBack()}
            >
              <Icon name="chevrons-left" alt="back" /> Back to Reports
            </button>
          ) : (
            <button
              className="button is-link is-pulled-right"
              onClick={() => setIsEdit(true)}
            >
              <Icon name="plus" alt="plus" /> Create New Report
            </button>
          )}
        </div>
      </Container>
      {isEdit ? (
        <ReportForm
          badges={badges}
          fields={fields}
          onSubmit={(report: Report): void => {
            handleDownload(report)
            handleBack()
          }}
          initial={typeof isEdit !== 'boolean' ? isEdit : undefined}
        />
      ) : (
        <div style={{ padding: '2em' }}>
          <table className="table" style={{ width: '100%' }}>
            <TableHeadDivider>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Author</TableHeader>
                <TableHeader>Date Created</TableHeader>
                <TableHeader>Last Report</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </TableHeadDivider>
            <tbody>
              {reports.map((report, i) => (
                <tr key={i}>
                  <TableData>
                    <Icon
                      name={report.public ? 'globe' : 'user'}
                      alt={report.public ? 'public' : 'private'}
                    />{' '}
                    {report.name || <span>None</span>}
                  </TableData>
                  <TableData>{report.creator || <span>None</span>}</TableData>
                  <TableData>
                    {report.created_at ? (
                      <TimeAgo date={report.created_at} />
                    ) : (
                      <span>None</span>
                    )}
                  </TableData>
                  <TableData>
                    {report.updated_at ? (
                      <TimeAgo date={report.updated_at} />
                    ) : (
                      <span>None</span>
                    )}
                  </TableData>
                  <TableData>
                    <div className="buttons">
                      <button
                        onClick={() => handleDownload(report)}
                        className="button is-small is-success"
                      >
                        <Icon name="play" /> Run
                      </button>
                      <button
                        onClick={() => {
                          setIsEdit(report)
                        }}
                        className="button is-small is-info"
                      >
                        <Icon name="edit" /> Edit
                      </button>
                      <button
                        className="button is-small is-danger"
                        onClick={() => {
                          doApiRequest(`/reports/${report.id}/?format=json`, {
                            method: 'DELETE',
                          }).then(reloadReports)
                        }}
                      >
                        <Icon name="trash" /> Delete
                      </button>
                    </div>
                  </TableData>
                </tr>
              ))}
              {!reports.length && (
                <tr>
                  <TableData colSpan={3}>
                    <Empty>There are no existing reports.</Empty>
                  </TableData>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

Reports.getInitialProps = async (ctx: NextPageContext) => {
  const data = {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  }

  const [fieldsReq, badgesReq] = await Promise.all([
    doApiRequest('/clubs/fields/?format=json', data),
    doApiRequest('/badges/?format=json', data),
  ])

  const [fieldsRes, badgesRes] = await Promise.all([
    fieldsReq.json(),
    badgesReq.json(),
  ])

  return { nameToCode: fieldsRes, badges: badgesRes }
}

Reports.permissions = ['clubs.generate_reports']

export default renderPage(Reports)
