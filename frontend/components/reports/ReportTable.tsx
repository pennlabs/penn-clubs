import React, { ReactElement } from 'react'
import TimeAgo from 'react-timeago'
import styled from 'styled-components'

import { CLUBS_GREY, CLUBS_GREY_LIGHT, LIGHT_GRAY } from '../../constants'
import { Report } from '../../types'
import { Empty, Icon } from '../common'

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

type ReportTableProps = {
  reports: Report[]
  onRun: (report: Report) => void
  onEdit: (report: Report) => void
  onDelete: (report: Report) => void
}

const ReportTable = ({
  reports,
  onRun,
  onEdit,
  onDelete,
}: ReportTableProps): ReactElement<any> => {
  return (
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
          {reports &&
            reports.map((report, i) => (
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
                      onClick={() => onRun(report)}
                      className="button is-small is-success"
                    >
                      <Icon name="play" /> Run
                    </button>
                    <button
                      onClick={() => onEdit(report)}
                      className="button is-small is-info"
                    >
                      <Icon name="edit" /> Edit
                    </button>
                    <button
                      className="button is-small is-danger"
                      onClick={() => onDelete(report)}
                    >
                      <Icon name="trash" /> Delete
                    </button>
                  </div>
                </TableData>
              </tr>
            ))}
          {(!reports || !reports.length) && (
            <tr>
              <TableData colSpan={3}>
                <Empty>There are no existing reports.</Empty>
              </TableData>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ReportTable
