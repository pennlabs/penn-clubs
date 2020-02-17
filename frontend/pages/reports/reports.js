import s from 'styled-components'
import { useEffect, useState } from 'react'
import {
  Icon,
  Flex,
  Empty,
  Checkbox,
  CheckboxLabel,
} from '../../components/common'
import { doApiRequest, API_BASE_URL } from '../../utils'
import { Container } from '../../components/common/Container'
import { CLUBS_GREY } from '../../constants/colors'

const TallTextArea = s.textarea`
  height: 6em;
`

const Reports = ({
  reports,
  serializeParams,
  updateReportFlag,
  reportFlag,
}) => {
  return (
    <div>
      <h1 className="title" style={{ color: CLUBS_GREY }}>
        Run existing report
      </h1>
      <div className="box">
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, i) => (
              <tr key={i}>
                <td>{report.name || <Empty>None</Empty>}</td>
                <td>{report.description || <Empty>None</Empty>}</td>
                <td>
                  <div className="buttons">
                    <a
                      href={`${API_BASE_URL}/clubs/?existing=true&${serializeParams(
                        JSON.parse(report.parameters)
                      )}`}
                      target="_blank"
                      className="button is-small is-success"
                    >
                      <Icon name="download" alt="download" />
                      Download
                    </a>
                    <button
                      onClick={() => {
                        doApiRequest(`/reports/${report.id}/?format=json`, {
                          method: 'DELETE',
                        }).then(() => {
                          updateReportFlag(!reportFlag)
                        })
                      }}
                      className="button is-danger is-small"
                    >
                      <Icon name="trash" alt="delete" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!reports.length && (
              <tr>
                <td colSpan="3">
                  <Empty>There are no existing reports.</Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reports
