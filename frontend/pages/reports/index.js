import s from 'styled-components'
import Router from 'next/router'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import renderPage from '../../renderPage.js'
import { Icon, Empty, Checkbox, CheckboxLabel } from '../../components/common'
import { doApiRequest, API_BASE_URL } from '../../utils'
import {
  CLUBS_GREY,
  CLUBS_BLUE,
  CLUBS_RED,
  CLUBS_NAVY,
  CLUBS_GREY_LIGHT,
  FOCUS_GRAY,
  WHITE,
} from '../../constants/colors'
import Edit from './edit'

const GroupLabel = s.h4`
  margin-bottom: 0em !important;
  font-size: 32px;
  color: #626572;
`

const ColoredHeader = s.div`
  background: linear-gradient(to right, #ef4c5f, #4954f4);
  height: 7em;
  line-height: normal;
  vertical-align: middle;
  padding: 2em;
  display: flex;
  justify-content: space-between;
`

const TransparentTitle = s.span`
  width: 9em;
  height: 2em;
  line-height: 2em;
  border-radius: 17px;
  border: 0;
  background: rgba(255,255,255,0.32);
  font-size: 15px;
  text-align: center; 
  color: rgba(255,255,255,1);
  vertical-align: middle;
  margin-left: 2em;
  margin-bottom: 1em;
  display: inline-block;
`

const TransparentButton = s.button`
  width: 12.5em;
  height: 2.5em;
  border-radius: 17px;
  border: 0;
  background: rgba(255,255,255,0.32);
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: ${WHITE};
`

const ActionButton = s.button`
  width: 4.5em;
  height: 2em;
  border-radius: 0.2em;
  border: 0;
  box-shadow: 0 2px 4px 0 rgba(161, 161, 161, 0.5);
  line-height: 0.6em;
  vertical-align: middle;
  color: ${WHITE};
  margin-left: 0.4em;
  margin-right: 0.4em;
  font-weight: 500;
`

const TableHeader = s.th`
  font-weight: 550;
  color: ${CLUBS_GREY};
`

const TableData = s.td`
  color: ${CLUBS_GREY_LIGHT};
`

const TableHeadDivider = s.thead`
  width: 1px;
  border-bottom: 1px solid #979797;
`

const serializeParams = params => {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

const Reports = ({ nameToCode }) => {
  const fields = {
    Fields: Object.keys(nameToCode),
  }

  const [reports, setReports] = useState([])
  const [reportFlag, updateReportFlag] = useState(false)

  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    doApiRequest('/reports/?format=json')
      .then(resp => {
        if (resp.ok) {
          return resp.json()
        } else {
          return []
        }
      })
      .then(data => setReports(data))
  }, [reportFlag])

  const [includedFields, setIncludedFields] = useState(
    (() => {
      const initial = {}
      Object.keys(fields).forEach(group =>
        fields[group].forEach(f => {
          initial[f] = false
        })
      )
      return initial
    })()
  )

  const query = {
    format: 'xlsx',
    fields: Object.keys(includedFields)
      .filter(field => includedFields[field])
      .map(name => nameToCode[name])
      .filter(e => e !== undefined),
  }

  const generateCheckboxGroup = (groupName, fields) => {
    return (
      <div key={groupName} style={{ flexBasis: '50%', flexShrink: 0 }}>
        <GroupLabel
          key={groupName}
          className="subtitle is-4"
          style={{ color: CLUBS_GREY }}
        >
          {groupName}
        </GroupLabel>
        {fields.map((field, idx) => (
          <div key={idx}>
            <Checkbox
              id={field}
              checked={includedFields[field]}
              onChange={() => {
                setIncludedFields(prev => ({ ...prev, [field]: !prev[field] }))
              }}
            />
            {'  '}
            <CheckboxLabel htmlFor={field}>{field}</CheckboxLabel>
          </div>
        ))}
      </div>
    )
  }

  const handleBack = () => {
    setIsEdit(false)
    Router.push('/reports')
  }

  const handleDownload = report => {
    window.location.href = `${API_BASE_URL}/clubs/?existing=true&${serializeParams(
      JSON.parse(report.parameters)
    )}`
  }

  return (
    <div>
      {isEdit ? (
        <div>
          <ColoredHeader>
            <span className="title is-2" style={{ color: 'white' }}>
              Create a new report
            </span>
            <TransparentButton onClick={() => handleBack()}>
              Back to all reports
            </TransparentButton>
          </ColoredHeader>
          <Edit
            fields={fields}
            generateCheckboxGroup={generateCheckboxGroup}
            query={query}
            updateReportFlag={updateReportFlag}
            reportFlag={reportFlag}
            handleBack={handleBack}
          />
        </div>
      ) : (
        <div>
          <ColoredHeader>
            <div>
              <span className="title is-2" style={{ color: 'white' }}>
                Reports
              </span>
              <TransparentTitle>OSA Dashboard</TransparentTitle>
            </div>
            <TransparentButton onClick={() => setIsEdit(true)}>
              Create New Report <Icon name="plus" alt="plus" />
            </TransparentButton>
          </ColoredHeader>
          <div style={{ padding: '2em' }}>
            <table className="table" style={{ width: '100%' }}>
              <TableHeadDivider>
                <tr>
                  <TableHeader>Report Name</TableHeader>
                  <TableHeader>Created By</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Date Created</TableHeader>
                  <TableHeader>Last Report</TableHeader>
                  <TableHeader>Perform Actions</TableHeader>
                </tr>
              </TableHeadDivider>
              <tbody>
                {reports.map((report, i) => (
                  <tr key={i}>
                    <TableData>{report.name || <Empty>None</Empty>}</TableData>
                    <TableData>
                      {report.creator || <Empty>None</Empty>}
                    </TableData>
                    <TableData>
                      {report.description || <Empty>None</Empty>}
                    </TableData>
                    <TableData>
                      {report.dateCreated || <Empty>None</Empty>}
                    </TableData>
                    <TableData>
                      {report.lastReport || <Empty>None</Empty>}
                    </TableData>
                    <TableData>
                      <div className="buttons">
                        <ActionButton
                          onClick={() => handleDownload(report)}
                          style={{ backgroundColor: CLUBS_BLUE }}
                        >
                          Run
                        </ActionButton>
                        <ActionButton style={{ backgroundColor: CLUBS_NAVY }}>
                          Edit
                        </ActionButton>
                        <ActionButton
                          onClick={() => {
                            doApiRequest(`/reports/${report.id}/?format=json`, {
                              method: 'DELETE',
                            }).then(() => {
                              updateReportFlag(!reportFlag)
                            })
                          }}
                          style={{ backgroundColor: CLUBS_RED }}
                        >
                          Delete
                        </ActionButton>
                      </div>
                    </TableData>
                  </tr>
                ))}
                {!reports.length && (
                  <tr>
                    <TableData colSpan="3">
                      <Empty>There are no existing reports.</Empty>
                    </TableData>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <br />
        </div>
      )}
    </div>
  )
}

Reports.getInitialProps = async props => {
  const fieldsReq = await doApiRequest('/clubs/fields/?format=json')
  const fieldsRes = await fieldsReq.json()

  return { nameToCode: fieldsRes }
}

export default renderPage(Reports)
