import React, { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_BLUE, CLUBS_GREY, CLUBS_NAVY } from '../../constants/colors'

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

const SyncModal = (props: { calendarURL: string }): ReactElement => {
  const url = props.calendarURL
    ? `${window?.location.protocol ?? 'https:'}//${props.calendarURL}`
    : ''
  return (
    <ModalContainer>
      <Title>Sync To Calendar</Title>
      <div style={{ display: 'block', marginTop: '15px' }}>
        <div className="field has-addons is-expanded">
          <div className="field-label is-normal" style={{ flexGrow: 0 }}>
            <label className="label">URL:</label>
          </div>
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              readOnly
              value={url}
              style={{ border: `solid ${CLUBS_BLUE} 1px` }}
            />
          </div>
          <div className="control">
            <a
              className="button is-info"
              style={{ background: CLUBS_BLUE }}
              onClick={() => {
                navigator.clipboard.writeText(url)
              }}
            >
              Copy
            </a>
          </div>
        </div>
      </div>
      <Subtitle>Import to Google Calendar</Subtitle>
      <p>
        Use the URL above to import to Google Calendar. Need help?{' '}
        <a
          href="https://support.google.com/calendar/answer/37118"
          target="_blank"
        >
          Check out this guide!
        </a>
      </p>
      <Subtitle>Import to macOS Calendar</Subtitle>
      <p>
        Use the URL above to import to Calendar app. Need help?{' '}
        <a
          href="https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac"
          target="_blank"
        >
          Check out this guide!
        </a>
      </p>
    </ModalContainer>
  )
}

export default SyncModal
