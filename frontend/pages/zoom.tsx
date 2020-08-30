import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
}

const SmallEvent = s.div`
  padding: 10px;
  display: inline-block;
  vertical-align: top;
  background-color: ${WHITE};
  border: 1px solid ${LIGHT_GRAY};
  margin: 10px;
  border-radius: 3px;
  width: 350px;
`

type CheckListProps = {
  items: { value: boolean; label: string }[]
}

const CheckList = ({ items }: CheckListProps): ReactElement => {
  return (
    <ul>
      {items.map(({ value, label }) => (
        <li
          key={label}
          className={value ? 'has-text-success' : 'has-text-danger'}
        >
          <Icon name={value ? 'check' : 'x'} /> {label}
        </li>
      ))}
    </ul>
  )
}

const ZoomPage = ({ events }: ZoomPageProps): ReactElement => {
  const router = useRouter()
  const [nextUrl, setNextUrl] = useState<string>('/')
  const [zoomSettings, setZoomSettings] = useState<any>({})
  const [settingsNotif, setSettingsNotif] = useState<{
    success: boolean
    detail: string
  } | null>(null)
  const [isLoading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    setNextUrl(window.location.pathname)
  }, [])

  const loadSettings = async (refresh: boolean, noCache?: boolean) => {
    await doApiRequest(
      `/settings/zoom/?format=json&refresh=${refresh}&noCache=${
        noCache ?? false
      }`,
    )
      .then((resp) => resp.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setZoomSettings({ success: false, detail: data.join(' ') })
        } else {
          setZoomSettings(data)
        }
      })
  }

  useEffect(() => {
    loadSettings(false)
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
          You can use the tool below to automatically configure Zoom for you and
          get you set up for the virtual activities fair. If you run into any
          issues while using the tool, please contact <Contact />.
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
                    loadSettings(true, true)
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
              },
              {
                value: zoomSettings.settings.in_meeting.breakout_room,
                label: 'Breakout rooms enabled',
              },
              {
                value: !zoomSettings.settings.in_meeting.waiting_room,
                label: 'Waiting rooms disabled',
              },
              {
                value: zoomSettings.settings.in_meeting.co_host,
                label: 'Co-hosting enabled',
              },
              {
                value: zoomSettings.settings.in_meeting.screen_sharing,
                label: 'Screen sharing enabled',
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
                  setLoading(false)
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
              await loadSettings(true)
              setLoading(false)
            }}
          >
            <Icon name="shuffle" /> Refresh
          </button>
        </div>
        <h3>3. Setup Your Virtual Activities Fair Zoom Meeting</h3>
        <p>
          Here is a list of all of the virtual fair events that you have access
          to edit. Make sure that you have a Zoom link, description, and photo
          for all events! Events without these three attributes will be sent to
          the bottom of the list.
        </p>
        {events.map((event) => (
          <SmallEvent key={event.id}>
            <b>{event.name}</b>
            <div>
              <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)}>
                <a>{event.club_name}</a>
              </Link>
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
                    value: !!(event.url && event.url.includes('?pwd=')),
                    label: 'Includes password in zoom link',
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
        ))}
      </div>
    </Container>
  )
}

ZoomPage.getInitialProps = async (ctx: NextPageContext) => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [events] = await Promise.all([
    doApiRequest(
      `/events/owned/?format=json&type=${ClubEventType.FAIR}`,
      data,
    ).then((resp) => resp.json()),
  ])

  return { events }
}

export default renderPage(ZoomPage)
