import React, { ReactElement, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { CLUBS_GREY, CLUBS_NAVY } from '../../constants'
import { Club } from '../../types'
import { doApiRequest, intersperse } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  SITE_NAME,
} from '../../utils/branding'
import { Icon, Text } from '../common'

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
  color: ${CLUBS_NAVY};
  font-size: 15px;
  font-weight: bold;
`

const SyncModal = (props: { calendarURL: string }): ReactElement => {
  const [subscriptions, setSubscriptions] = useState<{ club: Club }[] | null>(
    null,
  )

  useEffect(() => {
    doApiRequest('/subscriptions/?format=json')
      .then((resp) => resp.json())
      .then(setSubscriptions)
  }, [])

  const url = props.calendarURL
    ? `${window?.location.protocol ?? 'https:'}//${props.calendarURL}`
    : ''
  return (
    <ModalContainer>
      <Title>Sync To Calendar</Title>
      <Text className="mt-3">
        You can use the ICS URL below to synchronize your {SITE_NAME} calendar
        with a calendar application of your choice. This calendar will show
        events for all of the {OBJECT_NAME_PLURAL} that you have subscribed to.
      </Text>
      <Text>
        This link is personalized for your account, don't share it with others.
      </Text>
      <div>
        <div className="field has-addons is-expanded">
          <div className="control">
            <a className="button is-static">ICS URL</a>
          </div>
          <div className="control is-expanded">
            <input
              className="input"
              type="text"
              readOnly
              value={url}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <div className="control">
            <a
              className="button is-info"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url)
                  toast('Copied to clipboard!', {
                    hideProgressBar: true,
                    type: 'info',
                  })
                } catch (error) {
                  toast('Failed to copy! You need to manually copy the URL.', {
                    hideProgressBar: true,
                    type: 'error',
                  })
                }
              }}
            >
              <Icon name="clipboard" /> Copy
            </a>
          </div>
        </div>
      </div>
      {subscriptions != null && (
        <Text className="mt-3">
          {subscriptions.length > 0 ? (
            <>
              You will see calendar events for <b>{subscriptions.length}</b>{' '}
              {subscriptions.length > 1
                ? OBJECT_NAME_PLURAL
                : OBJECT_NAME_SINGULAR}
              , including{' '}
              {intersperse(
                subscriptions
                  .slice(0, 3)
                  .map(({ club }) => <b key={club.code}>{club.name}</b>),
                ', ',
              )}
              .
            </>
          ) : (
            <>
              You have not subscribed to any {OBJECT_NAME_PLURAL} yet. Your
              calendar will be empty until you do so.
            </>
          )}
        </Text>
      )}
      <hr />
      <div className="columns has-text-centered">
        <div className="column">
          <Subtitle>Import to Google Calendar</Subtitle>
          <p>
            Use the URL above to import to Google Calendar. Need help?
            <br />
            <a
              href="https://support.google.com/calendar/answer/37100#add_via_link"
              target="_blank"
              rel="noreferrer noopener"
            >
              Check out this guide!
            </a>
          </p>
        </div>
        <div className="column">
          <Subtitle>Import to macOS Calendar</Subtitle>
          <p>
            Use the URL above to import to the macOS Calendar app. Need help?
            <br />
            <a
              href="https://support.apple.com/guide/calendar/subscribe-to-calendars-icl1022/mac"
              target="_blank"
              rel="noreferrer noopener"
            >
              Check out this guide!
            </a>
          </p>
        </div>
      </div>
    </ModalContainer>
  )
}

export default SyncModal
