import s from 'styled-components'
import { useState } from 'react'
import { Icon, Flex } from '../../components/common'
import { API_BASE_URL } from '../../utils'
import { Container } from '../../components/common/Container'
import { CLUBS_GREY, LIGHT_GRAY } from '../../constants/colors'

const TallTextArea = s.textarea`
  height: 6em;
  background-color: #f4f4f4;
  box-shadow: none;
`
const TransparentButton = s.button`
  width: 12.5em;
  height: 2.5em;
  border-radius: 17px;
  border: 0;
  background: #f2f2f2;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: ${LIGHT_GRAY};
  margin: 2em;
`

const MainContainer = s.div`
  display: flex;
  flex-wrap: nowrap;
`

const ReportsContainer = s.div`
  flex: 2 0 75%;
  margin: 2em;
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

  const handleGenerateReport = () => {
    window.open(
      `${API_BASE_URL}/clubs/?format=xlsx&name=${encodeURIComponent(
        nameInput
      )}&desc=${encodeURIComponent(descInput)}&fields=${encodeURIComponent(
        query.fields.join(',')
      )}`,
      '_blank'
    )
    updateReportFlag(!reportFlag)
    handleBack()
  }

  return (
    <MainContainer>
      <div>
        <TransparentButton onClick={() => handleBack()}>
          Back to all reports
        </TransparentButton>
      </div>
      <ReportsContainer>
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
                  style={{ backgroundColor: '#f4f4f4', boxShadow: 'none' }}
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
          onClick={() => handleGenerateReport()}
        >
          <Icon name="paperclip" alt="report" />
          Generate Report
        </button>
      </ReportsContainer>
    </MainContainer>
  )
}

export default Edit
