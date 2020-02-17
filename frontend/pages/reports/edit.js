import s from 'styled-components'
import { useState } from 'react'
import { Icon, Flex } from '../../components/common'
import { API_BASE_URL } from '../../utils'
import { Container } from '../../components/common/Container'
import { CLUBS_GREY } from '../../constants/colors'

const TallTextArea = s.textarea`
  height: 6em;
  background-color: #f4f4f4;
`

const Edit = ({
  fields,
  generateCheckboxGroup,
  query,
  updateReportFlag,
  reportFlag,
  handleBack,
}) => {
  const [nameInput, setNameInput] = useState('')
  const [descInput, setDescInput] = useState('')

  return (
    <div>
      <Container>
        <div className="box">
          <h3 className="title is-4" style={{ color: CLUBS_GREY }}>
            Report Details
          </h3>
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
                  onChange={e => setNameInput(e.target.value)}
                  style={{ backgroundColor: '#f4f4f4' }}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Description</label>
              <div className="control">
                <TallTextArea
                  name="description"
                  className="input"
                  type="text"
                  placeholder='e.g. "Pulls all clubs, the emails from club owners, and names of owners"'
                  value={descInput}
                  onChange={e => setDescInput(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="box">
          <h3 className="title is-4" style={{ color: CLUBS_GREY }}>
            Select fields to include
          </h3>
          <div>
            {fields ? (
              <Flex>
                {Object.keys(fields).map(group =>
                  generateCheckboxGroup(group, fields[group])
                )}
              </Flex>
            ) : null}
          </div>
        </div>
        <button
          className="button is-info"
          onClick={() => {
            window.open(
              `${API_BASE_URL}/clubs/?format=xlsx&name=${encodeURIComponent(
                nameInput
              )}&desc=${encodeURIComponent(
                descInput
              )}&fields=${encodeURIComponent(query.fields.join(','))}`,
              '_blank'
            )
            updateReportFlag(!reportFlag)
            handleBack()
          }}
        >
          <Icon name="paperclip" alt="report" />
          Generate Report
        </button>
      </Container>
    </div>
  )
}

export default Edit
