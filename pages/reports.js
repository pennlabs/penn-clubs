import { useState, useEffect } from 'react'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import { Icon, Flex } from '../components/common'
import { Sidebar } from '../components/common/Sidebar'
import { Container, WideContainer } from '../components/common/Container'
import { CLUBS_GREY, RED } from '../constants/colors'


const TallTextArea = s.textarea`
  height: 6em;
`

const GroupLabel = s.h4`
  margin-top: 1em;
  margin-bottom: 0em !important;
  font-size: 32px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: 0.8px;
  color: #626572;
`

// Hide checkbox visually but remain accessible to screen readers.
// Source: https://polished.js.org/docs/#hidevisually
const HiddenCheckbox = s.input.attrs({ type: 'checkbox' })`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

const StyledCheckbox = s.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  transition: all 150ms;

  ${HiddenCheckbox}:focus + & {
    box-shadow: 0 0 0 3px pink;
  }
`

const CheckboxContainer = s.div`
  display: inline-block;
  vertical-align: middle;
`

const Checkbox = ({ className, ...props }) => {
  let [checked, setChecked] = useState()
  return (
    <CheckboxContainer className={className} onClick={() => {console.log('ow!'); setChecked(!checked)}}>
      <HiddenCheckbox checked={checked} {...props} />
      <StyledCheckbox checked={checked}>
        <Icon name={checked ? 'check-box-red' : 'box-red'} /> 
      </StyledCheckbox>
    </CheckboxContainer>
  )
}
const Reports = ({query, userInfo, favorites, updateFavorites}) => {

  const fields = {
    'Basics': [
      'Name',
      'Subtitle',
      'Description',
      'Date Founded',
      'Size',
      'Activity',
      'Approval Status',
      'Parent Organization(s)',
      'How to get involved',
      'Badges'
    ],
    'Additional Links': [
      'Website',
      'Facebook',
      'Instagram',
      'Twitter',
      'Github',
      'Linkedin'
    ],
    'Contact Information': [
      'Owner name(s)',
      'Owner email(s)',
      'Listserv',
      'Officer name(s)',
      'Officer email(s)'
    ]
  }

  const generateCheckboxGroup = (groupName, fields) => {
    return (
      <div style={{flexBasis: '50%', flexShrink: 0}}>
        <GroupLabel className="subtitle is-4" style={{ color: CLUBS_GREY }}>{groupName}</GroupLabel>
        { fields.map(field => (
          <div>
            <Checkbox />{'  '}
            <span>{field}</span>
          </div>
        )) }
      </div>
    )
  }

  return (
    <div>
      <Sidebar>
        Sidebar! 
      </Sidebar>        
      <Container>
        <WideContainer>
          <h1 className="title" style={{ color: CLUBS_GREY }}>
            Create a new report 
          </h1>
          <div className="box">
            <h3 className="title is-4" style={{ color: CLUBS_GREY }}>
              Report Details
            </h3>
            <div>
            <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input name="name" className="input" type="text" placeholder='e.g. "Owner emails"' />
              </div>
            </div>
            <div className="field">
              <label className="label">Description</label>
              <div className="control">
                <TallTextArea name="description" className="input" type="text" placeholder='e.g. "Pulls all clubs, the emails from club owners, and names of owners"' />
              </div>
            </div>
            </div>
          </div> 
          <div className="box">
            <h3 className="title is-4" style={{ color: CLUBS_GREY}} >
              Select fields to include
            </h3>
            <div>
              <Flex>
                { Object.keys(fields).map(group => generateCheckboxGroup(group, fields[group])) }
              </Flex>
            </div>
          </div>
        </WideContainer>
      </Container>
    </div>
  )
}

export default renderPage(Reports)