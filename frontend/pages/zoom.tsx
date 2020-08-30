import moment from 'moment'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import {
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
} from '../components/common'
import {
  CLUB_EDIT_ROUTE,
  CLUB_ROUTE,
  CLUBS_GREY_LIGHT,
  LIGHT_GRAY,
  SNOW,
  WHITE,
  ZOOM_BLUE,
} from '../constants'
import renderPage from '../renderPage'
import { ClubEvent, ClubEventType } from '../types'
import { doApiRequest } from '../utils'

type ZoomPageProps = {
  events: ClubEvent[]
  zoomSettings: ZoomSettings
}

type ZoomSettings = any

type ZoomMeeting = {
  uuid: string
  id: number
  host_id: string
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  created_at: string
  join_url: string
}

const SmallEvent = s.div`
  padding: 10px;
  display: block;
  vertical-align: top;
  background-color: ${WHITE};
  border: 1px solid ${LIGHT_GRAY};
  margin: 10px 0px;
  border-radius: 3px;

  & .has-text-warning {
    color: #FFA500 !important;
  }
`

type CheckListProps = {
  items: { value: boolean | null; label: string; details?: string }[]
}

const CheckList = ({ items }: CheckListProps): ReactElement => {
  return (
    <ul>
      {items.map(({ value, label, details }) => (
        <li
          key={label}
          className={
            value
              ? 'has-text-success'
              : value == null
              ? 'has-text-warning'
              : 'has-text-danger'
          }
        >
          <Icon
            name={value ? 'check' : value == null ? 'alert-triangle' : 'x'}
          />{' '}
          {label}
          {details != null && (
            <div className="is-size-7 ml-5 mb-2">{details}</div>
          )}
        </li>
      ))}
    </ul>
  )
}

/**
 * Fetch the current user's zoom settings from the server.
 */
const loadSettings = async (
  refresh: boolean,
  noCache?: boolean,
  data?: ZoomSettings,
) => {
  return await doApiRequest(
    `/settings/zoom/?format=json&refresh=${refresh}&noCache=${
      noCache ?? false
    }`,
    data,
  )
    .then((resp) => resp.json())
    .then((data) => {
      if (Array.isArray(data)) {
        return { success: false, detail: data.join(' ') }
      }
      return data
    })
}

const ZoomPage = ({
  events,
  zoomSettings: initialZoomSettings,
}: ZoomPageProps): ReactElement => {
  const [nextUrl, setNextUrl] = useState<string>('/')
  const [zoomSettings, setZoomSettings] = useState<ZoomSettings>(
    initialZoomSettings,
  )
  const [settingsNotif, setSettingsNotif] = useState<{
    success: boolean
    detail: string
  } | null>(null)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [userMeetings, setUserMeetings] = useState<ZoomMeeting[]>([])

  useEffect(() => {
    doApiRequest(`/settings/zoom/meetings/?format=json`)
      .then((resp) => resp.json())
      .then((data) => setUserMeetings(data.meetings.meetings))
  }, [])

  useEffect(() => {
    setNextUrl(window.location.pathname)
  }, [])

  return (
    <Container background={SNOW}>
      <Metadata title="Zoom Configuration" />
      <InfoPageTitle className="mb-0">Zoom Configuration</InfoPageTitle>
      <p
        className="subtitle is-size-5 mb-3"
        style={{ color: CLUBS_GREY_LIGHT }}
      >
        Virtual Club Fair
      </p>
      <div className="content">
        <p>
          You can use the 4-step process below to automatically configure Zoom
          for you and get you set up for the virtual activities fair. If you run
          into any issues while using the tool, please contact <Contact />.
        </p>
        <h3>1. Login to your Zoom Account</h3>
        <p>
          Use the button below to login to Zoom and link your Zoom account to
          Penn Clubs. We will request user and meeting settings write access to
          help you configure your meeting. Ensure that you login to your{' '}
          <b>Penn provided</b> Zoom account.
        </p>
        <p>
          To do this, use the <b>Sign in with SSO</b> button on the Zoom login
          page that appears when you click the login button below and enter{' '}
          <b>upenn</b> as the domain name.
        </p>
        {!zoomSettings.success ? (
          <a
            className="button is-info"
            style={{ backgroundColor: ZOOM_BLUE }}
            href={`/api/social/login/zoom-oauth2/?next=${nextUrl}`}
          >
            <Icon name="video" /> Login to Zoom
          </a>
        ) : (
          <>
            <p className="has-text-info">
              <b>Success!</b> You are logged into Zoom and your account is
              connected to Penn Clubs.
            </p>
            <div className="buttons">
              <a
                className="button is-info is-small"
                style={{ backgroundColor: ZOOM_BLUE }}
                href={`/api/social/login/zoom-oauth2/?next=${nextUrl}`}
              >
                <Icon name="video" /> Reconnect
              </a>
              <button
                className="button is-small"
                onClick={() => {
                  doApiRequest(
                    `/social/disconnect/zoom-oauth2/?next=${nextUrl}`,
                    { method: 'POST' },
                  ).finally(() => {
                    loadSettings(true, true).then(setZoomSettings)
                  })
                }}
              >
                <Icon name="x" /> Disconnect
              </button>
            </div>
          </>
        )}
        <h3>2. Configure Your User Account Settings</h3>
        <p>
          Below are your current user account settings. We can configure the
          most important ones for you to ensure that your virtual fair booth has
          a smooth and uninterrupted experience.
        </p>
        {zoomSettings.success ? (
          <CheckList
            items={[
              {
                value: zoomSettings.settings.feature.meeting_capacity >= 300,
                label: 'Zoom meeting room capacity at least 300 people',
                details:
                  'We cannot adjust this setting for you. If your account does not support 300 people, you are most likely not logged into your Penn account. If this happens to you, disconnect your account and login to your Penn account.',
              },
              {
                value: zoomSettings.settings.in_meeting.breakout_room,
                label: 'Breakout rooms enabled',
                details:
                  'Breakout rooms will allow you to setup one on one interactions with prospective members. This setting should be enabled.',
              },
              {
                value: !zoomSettings.settings.in_meeting.waiting_room,
                label: 'Waiting rooms disabled',
                details:
                  'We recommend disabling waiting rooms and relying on Zoom authentication and meeting passwords. This will save you from the hassle of having to admit people periodically.',
              },
              {
                value: zoomSettings.settings.in_meeting.co_host,
                label: 'Co-hosting enabled',
                details:
                  'We recommend that you enable co-hosting on your account to allow other officers to assist you with managing Zoom and taking over if you get disconnected.',
              },
              {
                value: zoomSettings.settings.in_meeting.screen_sharing,
                label: 'Screen sharing enabled',
                details:
                  'If you would like to share a presentation or other materials, ensure that you have screen sharing enabled on your account.',
              },
            ]}
          />
        ) : (
          zoomSettings.detail && (
            <div className="notification is-warning">
              <Icon name="alert-triangle" /> {zoomSettings.detail}
            </div>
          )
        )}
        {settingsNotif != null && (
          <div
            className={`notification ${
              settingsNotif.success ? 'is-success' : 'is-danger'
            }`}
          >
            {settingsNotif.detail}
          </div>
        )}
        <p>
          Pressing the button below will automatically configure your Zoom
          account with the recommended settings.
        </p>
        <div className="buttons">
          <button
            className="button is-success"
            disabled={isLoading || !zoomSettings.success}
            onClick={() => {
              setLoading(true)
              doApiRequest('/settings/zoom/?format=json', { method: 'POST' })
                .then((resp) => resp.json())
                .then((data) => {
                  if (Array.isArray(data)) {
                    setSettingsNotif({ success: false, detail: data.join(' ') })
                  } else {
                    setSettingsNotif(data)
                  }
                  loadSettings(false)
                    .then(setZoomSettings)
                    .then(() => {
                      setLoading(false)
                    })
                })
            }}
          >
            <Icon name="settings" /> Update Settings
          </button>
          <button
            className="button"
            disabled={isLoading || !zoomSettings.success}
            onClick={async () => {
              setLoading(true)
              const settings = await loadSettings(true)
              setZoomSettings(settings)
              setLoading(false)
            }}
          >
            <Icon name="shuffle" /> Refresh
          </button>
        </div>
        <h3>3. Setup Your Virtual Activities Fair Zoom Meeting</h3>
        <p>
          Here is a list of all of the virtual fair events that you have access
          to edit. Make sure that you have a{' '}
          <b>valid Zoom link, description, and photo</b> for all events! Events
          without any of these three attributes will be sent to the bottom of
          the list.
        </p>
        <p>
          If you have multiple clubs participating in the Zoom fair, have a
          different officer create a Zoom meeting for each club. Zoom does not
          allow you to have multiple meetings in the same time slot.
        </p>
        <div className="mb-3">
          {events.map((event) => {
            let zoomId: number | null = null
            if (event.url != null) {
              const match = event.url.match(/\/\w\/(\w+)\??/)
              if (match != null) {
                zoomId = parseInt(match[1])
              }
            }

            const matchingMeeting = userMeetings.find(({ id }) => id === zoomId)
            const startTime = moment(event.start_time)
            const endTime = moment(event.end_time)

            return (
              <SmallEvent key={event.id}>
                <b>{event.name}</b>
                <div>
                  <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)}>
                    <a>{event.club_name}</a>
                  </Link>
                  <div>
                    {startTime.format('LLL')} - {endTime.format('LT')}
                  </div>
                  <span className="has-text-grey">
                    {moment.duration(endTime.diff(startTime)).asHours()} Hour
                    Block
                  </span>
                  <CheckList
                    items={[
                      {
                        value: !!event.url,
                        label: 'Has link to meeting',
                      },
                      {
                        value: !!(event.url && event.url.includes('zoom.us')),
                        label: 'Is a Zoom link',
                      },
                      {
                        value: !!(
                          event.url &&
                          event.url.startsWith('https://upenn.zoom.us/')
                        ),
                        label: 'Is Penn Zoom link',
                      },
                      {
                        value: !!(event.url && event.url.includes('?pwd=')),
                        label: 'Includes password in zoom link',
                        details:
                          'Including your meeting password in the Zoom link will save students from having to enter it when they connect.',
                      },
                      {
                        value: matchingMeeting != null ? true : null,
                        label: 'You own the Zoom meeting',
                        details:
                          'If you own the Zoom meeting, we can perform additional checks on the meeting to ensure you have set everything up correctly.',
                      },
                      {
                        value:
                          matchingMeeting != null
                            ? matchingMeeting.duration >= 60 * 3
                            : null,
                        label: 'Meeting duration matches fair duration',
                      },
                      {
                        value:
                          matchingMeeting != null
                            ? moment(matchingMeeting.start_time).isSame(
                                startTime,
                              )
                            : null,
                        label: 'Meeting time matches fair start time',
                      },
                      {
                        value:
                          event.description.length > 3 &&
                          event.description !== 'Replace this description!',
                        label: 'Has meaningful description',
                      },
                      {
                        value: !!event.image_url,
                        label: 'Has cover photo',
                      },
                    ]}
                  />
                </div>
                <div className="mt-3">
                  <Link
                    href={CLUB_EDIT_ROUTE() + '#events'}
                    as={CLUB_EDIT_ROUTE(event.club) + '#events'}
                  >
                    <a className="button is-small is-info">
                      <Icon name="edit" /> Edit Event
                    </a>
                  </Link>
                </div>
              </SmallEvent>
            )
          })}
        </div>
        <h3>4. Accessing your Meeting during the Activities Fair</h3>
        <p>TODO</p>
      </div>
    </Container>
  )
}

ZoomPage.getInitialProps = async (ctx: NextPageContext) => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [events, zoomSettings] = await Promise.all([
    doApiRequest(
      `/events/owned/?format=json&type=${ClubEventType.FAIR}`,
      data,
    ).then((resp) => resp.json()),
    loadSettings(false, false, data),
  ])

  return { events, zoomSettings }
}

export default renderPage(ZoomPage)
