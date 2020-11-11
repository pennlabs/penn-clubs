import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Flex, Icon, Text } from '../../components/common'
import { Report } from '../../types'
import { API_BASE_URL } from '../../utils'

const ReportContainer = styled.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 800px;
`

type Props = {
  fields: { [key: string]: string[] }
  generateCheckboxGroup: (key: string, fields: string[]) => ReactElement
  query: { fields: string[] }
  initial?: Report
  onSubmit: () => void
}

const ReportForm = ({
  fields,
  generateCheckboxGroup,
  query,
  onSubmit,
  initial,
}: Props): ReactElement => {
  const [nameInput, setNameInput] = useState(initial?.name ?? '')
  const [descInput, setDescInput] = useState(initial?.description ?? '')

  const handleGenerateReport = (): void => {
    window.open(
      `${API_BASE_URL}/clubs/?format=xlsx&name=${encodeURIComponent(
        nameInput,
      )}&desc=${encodeURIComponent(descInput)}&fields=${encodeURIComponent(
        query.fields.join(','),
      )}`,
      '_blank',
    )
    onSubmit()
  }

  return (
    <ReportContainer>
      <div className="box">
        <h3 className="title is-4">Report Details</h3>
        <Text>
          All report detail fields are optional. If you do not specify a report
          name, a temporary report will be generated and you will not be able to
          rerun the report.
        </Text>
        <div>
          <div className="field">
            <label className="label">Name</label>
            <div className="control">
              <input
                name="name"
                className="input"
                type="text"
                placeholder='e.g. "Owner emails"'
                value={nameInput}
                disabled={!!initial?.name}
                onChange={(e) => setNameInput(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label className="label">Description</label>
            <div className="control">
              <textarea
                name="description"
                className="input textarea"
                placeholder='e.g. "Pulls all clubs, the emails from club owners, and names of owners"'
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="box">
        <h3 className="title is-4">Included Fields</h3>
        <Text>
          Select the fields you want to include below as columns in the
          generated spreadsheet file.
        </Text>
        <div>
          {fields ? (
            <Flex>
              {Object.keys(fields).map((group) =>
                generateCheckboxGroup(group, fields[group]),
              )}
            </Flex>
          ) : null}
        </div>
      </div>
      <button className="button is-info" onClick={() => handleGenerateReport()}>
        <Icon name="paperclip" alt="report" />
        Generate Report
      </button>
    </ReportContainer>
  )
}

export default ReportForm
