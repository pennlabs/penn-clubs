import React, { ReactElement } from 'react'
import styled from 'styled-components'

import {
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_NAVY,
  WHITE,
} from '../../constants/colors'

const ModalContainer = styled.div`
  text-align: left;
  padding: 40px;
`

const Title = styled.div`
  color: ${CLUBS_GREY};
  font-size: 25px;
  font-weight: bold;
`

const Subtitle = styled.div`
  margin: 15px 0;
  color: ${CLUBS_NAVY};
  font-size: 15px;
  font-weight: bold;
`

const URLCell = styled.input`
  flex: 1;
  font-size: 15px;
  outline: none;
  border: solid 1px ${CLUBS_BLUE};
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  padding: 10px;
  margin-left: 10px;
`

const URLCopyButton = styled.div`
  font-size: 15px;
  line-height: 15px;
  background: ${CLUBS_BLUE};
  color: ${WHITE};
  align-self: stretch;
  display: grid;
  place-items: center;
  padding: 10px;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
`

const SyncModal = (props: {}): ReactElement => {
  return (
    <ModalContainer>
      <Title>Sync To Calendar</Title>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '10px',
        }}
      >
        <b>URL: </b>
        <URLCell readOnly value={'https://pennclubs.com/abc'} />
        <URLCopyButton>Copy</URLCopyButton>
      </div>
      <Subtitle>Import to Google Calendar</Subtitle>
      <p>Copy and paste the URL above to import to Google Calendar.</p>
      <Subtitle>Import to iCal</Subtitle>
      <p>Copy and paste the URL above to import to iCal.</p>
    </ModalContainer>
  )
}

export default SyncModal
