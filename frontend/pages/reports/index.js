import s from 'styled-components'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import renderPage from '../../renderPage.js'
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
import Link from 'next/link'
import Edit from './edit'

const TallTextArea = s.textarea`
  height: 6em;
`

const GroupLabel = s.h4`
  margin-bottom: 0em !important;
  font-size: 32px;
  color: #626572;
`

const ColoredHeader = s.div`
  background: linear-gradient(to right, #ef4c5f, #4954f4);
  height: 7em;
`

const TransparentButton = s.button`
  width: 190px;
  height: 35px;
  border-radius: 17px;
  border: 0;
  background: rgba(255,255,255,0.32);
  float: right;
  font-size: 15px;
  font-family: Lato;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  color: rgba(255,255,255,1)
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

  return (
    <div>
      {isEdit ? (
        <div>
          <ColoredHeader>
            <div style={{ padding: '2em' }}>
              <span className="title is-3" style={{ color: 'white' }}>
                Create a new report
              </span>
              <TransparentButton onClick={() => handleBack()}>
                Back to all reports
              </TransparentButton>
            </div>
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
            <div style={{ padding: '2em' }}>
              <span className="title is-3" style={{ color: 'white' }}>
                Reports
              </span>
              <TransparentButton onClick={() => setIsEdit(true)}>
                Create New Report
              </TransparentButton>
            </div>
          </ColoredHeader>
          <Container>
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
                              doApiRequest(
                                `/reports/${report.id}/?format=json`,
                                {
                                  method: 'DELETE',
                                }
                              ).then(() => {
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
            <br />
          </Container>
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
