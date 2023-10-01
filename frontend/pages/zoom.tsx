import {
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
} from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { LiveStats } from 'components/EventPage/EventModal'
import { FileField, RichTextField } from 'components/FormComponents'
import { Field, Form, Formik } from 'formik'
import moment from 'moment-timezone'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { ClubEvent, ClubEventType, ClubFair } from 'types'
import { doApiRequest } from 'utils'
import {
  FAIR_NAME,
  FAIR_NAME_CAPITALIZED,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SCHOOL_NAME,
  SITE_NAME,
} from 'utils/branding'

import {
  CLUB_EDIT_ROUTE,
  CLUB_ROUTE,
  CLUBS_GREY_LIGHT,
  LIGHT_GRAY,
  SNOW,
  WHITE,
  ZOOM_BLUE,
} from '~/constants'

type ZoomPageProps = {
  authenticated: boolean | null
  events: ClubEvent[]
  fairs: ClubFair[]
  userMeetings: ZoomMeeting[]
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
  extra_details: any
}

const SmallEvent = styled.div`
  padding: 10px;
  display: block;
  vertical-align: top;
  background-color: ${WHITE};
  border: 1px solid ${LIGHT_GRAY};
  margin: 10px 0px;
  border-radius: 3px;

  & .has-text-warning {
    color: #ffa500 !important;
  }

  & .has-text-grey {
    color: #595959 !important;
  }
`

type CheckListProps = {
  items: {
    value: boolean | null
    label: string | ReactElement
    details?: string | ReactElement
  }[]
}

/**
 * A unordered list, except Bulma text color constants have been
 * overwritten to provide better contrast in accordance with AAA guidelines.
 */
const AccessibleColorList = styled.ul`
  & .has-text-success {
    color: #1d5d36 !important;
  }

  & .has-text-danger {
    color: #a60c2b !important;
  }

  & .has-text-warning {
    color: #7a5000 !important;
  }
`

const CheckList = ({ items }: CheckListProps): ReactElement => {
  return (
    <AccessibleColorList>
      {items.map(({ value, label, details }, i) => (
        <li
          key={i}
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
    </AccessibleColorList>
  )
}

/**
 * Fetch the current user's zoom settings from the server.
 * @param refresh If true, disable cache while fetching the request.
 * @param noCache If true, delete the existing cache while fetching the request.
 * @param data Additional data to be sent with the request.
 */
const loadSettings = async (
  refresh: boolean,
  noCache?: boolean,
  data?: any,
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

/**
 * Fetch meetings stored in Zoom from the server.
 * @param data Additional data to be sent with the request.
 * @param refresh If true, disable cache when fetching the request.
 */
const loadMeetings = async (
  data?: any,
  refresh?: boolean,
): Promise<ZoomMeeting[]> => {
  return doApiRequest(
    `/settings/zoom/meetings/?format=json&refresh=${refresh ?? 'false'}`,
    data,
  )
    .then((resp) => resp.json())
    .then((data) => {
      const meetings = (data.meetings ?? { meetings: [] }).meetings ?? []
      if (data.extra_details) {
        meetings.forEach((meeting) => {
          if (meeting.id in data.extra_details) {
            meeting.extra_details = data.extra_details[meeting.id]
          }
        })
      }
      return meetings
    })
}

/**
 * Fetch events stored in Django from the server.
 * @param data Additional data to be sent with the request.
 */
const loadEvents = (data?: any): Promise<ClubEvent[]> => {
  return doApiRequest(
    `/events/owned/?format=json&type=${ClubEventType.FAIR}`,
    data,
  ).then((resp) => resp.json())
}

/**
 * A fake live statistics widget with some fake numbers.
 */
const LiveStatsDemo = (): ReactElement => {
  const [attending, setAttending] = useState<number>(15)
  const [attended, setAttended] = useState<number>(43)
  const times = useRef<number>(0)

  useEffect(() => {
    const upd = setInterval(() => {
      if (Math.random() > 0.7 || times.current <= 3) {
        const incr = Math.random() > 0.5 ? 1 : -1
        setAttending((attending) => Math.max(attending + incr, 0))
        if (incr < 0) {
          setAttended((attended) => attended + 1)
        }
      }
      times.current += 1
    }, 2000)
    return () => clearInterval(upd)
  }, [])

  return <LiveStats stats={{ attending, attended, officers: 3, time: 600 }} />
}

const ZoomPage = ({
  authenticated,
  events: initialEvents,
  zoomSettings: initialZoomSettings,
  userMeetings: initialUserMeetings,
  fairs,
}: ZoomPageProps): ReactElement => {
  const [nextUrl, setNextUrl] = useState<string>('/')
  const [zoomSettings, setZoomSettings] =
    useState<ZoomSettings>(initialZoomSettings)
  const [events, setEvents] = useState<ClubEvent[]>(initialEvents)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [userMeetings, setUserMeetings] =
    useState<ZoomMeeting[]>(initialUserMeetings)

  useEffect(() => {
    setNextUrl(window.location.pathname)
  }, [])

  if (authenticated === false) {
    return <AuthPrompt />
  }

  const wrongEmail =
    zoomSettings.email && !zoomSettings.email.endsWith('@upenn.edu')

  const forceDisconnect = () =>
    doApiRequest(`/social/disconnect/zoom-oauth2/?next=${nextUrl}`, {
      method: 'POST',
    }).finally(() => {
      loadSettings(true, true).then(setZoomSettings)
    })

  return (
    <Container background={SNOW}>
      <Metadata title="Zoom Configuration" />
      <InfoPageTitle>Zoom Configuration</InfoPageTitle>
      <p
        className="subtitle is-size-5 mb-3"
        style={{ color: CLUBS_GREY_LIGHT }}
      >
        {fairs.map((fair) => fair.name).join(', ')}
      </p>
      <div className="content">
        <p>
          You can use the 4-step process below to automatically configure Zoom
          for you and get you set up for the upcoming {FAIR_NAME} fair. If you
          run into any issues while using the tool, please contact <Contact />.
        </p>
        <p>
          Using this process will allow {SITE_NAME} to display live statistics
          about your Zoom meeting during the fair, including how many people are
          inside the meeting, the number of {OBJECT_NAME_SINGULAR} members in
          the meeting, how many people have already attended the meeting, and
          the median meeting participation time. On the day of the fair, the
          following information will appear when a student clicks your event:
        </p>
        <LiveStatsDemo />
        <h3>1. Login to your Zoom Account</h3>
        <p>
          Use the button below to login to Zoom and link your Zoom account to{' '}
          {SITE_NAME}. We will request user and meeting settings write access to
          help you configure your meeting. Ensure that you login to your{' '}
          <b>Penn provided</b> Zoom account.
        </p>
        {!zoomSettings.success ? (
          <>
            <p>
              To do this, use the <b>Sign in with SSO</b> button on the Zoom
              login page that appears when you click the login button below and
              enter <b>upenn</b> as the domain name.
            </p>
            <div className="columns">
              <div className="column has-text-centered">
                <img
                  src="/static/img/screenshots/zoom_web_login_1.png"
                  height={300}
                />
                <div className="has-text-grey">
                  Instead of entering a username or password, press the "Sign in
                  with SSO" button on the right column.
                </div>
              </div>
              <div className="column has-text-centered">
                <img
                  src="/static/img/screenshots/zoom_web_login_2.png"
                  height={300}
                />
                <div className="has-text-grey">
                  On the next screen that appears, enter "upenn" for the domain
                  name. You will then be redirected to a PennKey login.
                </div>
              </div>
            </div>
            <p>
              If you see a <b>You cannot authorize the app</b> message when
              clicking the button below, you are not logged into a Penn Zoom
              account. Log out of your current Zoom account and login to your
              Penn Zoom account to continue the process.
            </p>
            <a
              className="button is-info"
              style={{ backgroundColor: ZOOM_BLUE }}
              href={`/api/social/login/zoom-oauth2/?next=${nextUrl}`}
            >
              <Icon name="video" /> Login to Zoom
            </a>
          </>
        ) : (
          <>
            <p className="has-text-info">
              <b>Success!</b> You are logged into Zoom and your account is
              connected to {SITE_NAME}. Your Zoom account email is{' '}
              <b>{zoomSettings.email}</b>.
            </p>
            {wrongEmail && (
              <p className="has-text-danger">
                This does not appear to be a {SCHOOL_NAME} Zoom account. Are you
                sure you logged into the right email?
              </p>
            )}
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
                  if (wrongEmail) {
                    forceDisconnect()
                  } else {
                    toast.info(
                      <>
                        <div>
                          Are you sure you want to disconnect your Zoom account?
                          We will not be able to provide live statistics for
                          your meeting if you do.
                        </div>
                        <button
                          className="button is-danger is-small mt-2"
                          onClick={forceDisconnect}
                        >
                          <Icon name="trash" /> Disconnect
                        </button>
                      </>,
                    )
                  }
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
                  'We cannot adjust this setting for you. If your account does not support at least 300 people, you are most likely not logged into your Penn account. If this happens to you, disconnect your account and login to your Penn account.',
              },
              {
                value: zoomSettings.settings.in_meeting.breakout_room,
                label: 'Breakout rooms enabled',
                details:
                  'Enabling breakout rooms will allow you to setup one on one interactions with prospective members if you desire this functionality. This setting cannot be changed in the middle of a meeting. This setting should be enabled.',
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
                  'We recommend that you enable co-hosting on your account to allow other officers to assist you with managing Zoom and take over if you get disconnected.',
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
                    toast.error(data.join(' '))
                  } else {
                    toast[data.success ? 'success' : 'error'](data.detail)
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
              toast.info(
                'Your user account settings have been reloaded from Zoom.',
              )
            }}
          >
            <Icon name="refresh" /> Refresh
          </button>
        </div>
        <h3>3. Setup Your Virtual {FAIR_NAME_CAPITALIZED} Fair Zoom Meeting</h3>
        <p>
          Here is a list of all of the virtual fair events that you have access
          to edit. Make sure that you have a{' '}
          <b>valid meeting link, description, and cover photo</b> for all
          events!
        </p>
        <p>
          <b>
            If you have multiple {OBJECT_NAME_PLURAL} participating in the
            {FAIR_NAME} fair,
          </b>{' '}
          have a different officer create a Zoom meeting for each{' '}
          {OBJECT_NAME_SINGULAR}. Zoom does not allow you to have or join
          multiple meetings in the same time slot with one account.
        </p>
        <button
          className="button is-small"
          onClick={() => {
            loadMeetings(undefined, true).then(setUserMeetings)
            toast.info(
              `Your ${FAIR_NAME} fair events on ${SITE_NAME} have been reloaded.`,
            )
          }}
        >
          <Icon name="refresh" /> Refresh
        </button>
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
            const startTime = moment(event.start_time).tz('America/New_York')
            const endTime = moment(event.end_time).tz('America/New_York')
            const eventDuration = moment
              .duration(endTime.diff(startTime))
              .asMinutes()

            const matchingTime =
              matchingMeeting != null
                ? moment(matchingMeeting.start_time)
                : null

            return (
              <SmallEvent key={event.id}>
                <b>{event.name}</b>
                <div>
                  <Link
                    href={CLUB_ROUTE()}
                    as={CLUB_ROUTE(event.club as string)}
                  >
                    {event.club_name}
                  </Link>
                  <div>
                    {startTime.format('LLL')} - {endTime.format('LT z')}
                  </div>
                  <div className="has-text-grey">
                    {moment.duration(endTime.diff(startTime)).asHours()} Hour
                    Block
                  </div>
                  <div className="mt-3">
                    <b>Current Meeting Link:</b>{' '}
                    {event.url ? (
                      <a href={event.url} target="_blank">
                        {event.url}
                      </a>
                    ) : (
                      'None'
                    )}
                  </div>
                  <CheckList
                    items={[
                      {
                        value: !!event.url,
                        label: 'Has link to a meeting',
                      },
                      {
                        value: !!(event.url && event.url.includes('zoom.us')),
                        label: 'Is a Zoom link',
                        details: (
                          <>
                            Zoom is a proven and trusted platform for
                            videoconferencing and has a contract with the{' '}
                            {SCHOOL_NAME} to provide premium accounts.{' '}
                            <b>
                              We strongly recommend that you use this service
                              for your virtual fair booth.
                            </b>{' '}
                            By using a Penn Zoom link, we will also be able to
                            provide students with additional information, such
                            as how many people are currently in the meeting.
                          </>
                        ),
                      },
                      {
                        value: !!(
                          event.url &&
                          event.url.startsWith('https://upenn.zoom.us/')
                        ),
                        label: 'Is Penn Zoom link',
                        details:
                          'Penn Zoom links remove the 40 minute meeting restriction and allows you to have up to 300 particpants. We strongly recommend that you use the school provided Zoom account for your booth.',
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
                        details: `If you own the Zoom meeting, we can perform additional checks on the meeting to ensure you have set everything up correctly. ${
                          matchingMeeting != null
                            ? 'We have detected that you own this meeting.'
                            : 'We have detected that you do not own this meeting.'
                        }`,
                      },
                      {
                        value:
                          matchingMeeting != null
                            ? matchingMeeting.duration >= eventDuration
                            : null,
                        label: 'Meeting duration matches fair duration',
                        details:
                          matchingMeeting != null
                            ? `Your meeting is ${matchingMeeting.duration} minute(s) and the virtual fair event is for ${eventDuration} minute(s).`
                            : 'You must own the Zoom meeting to see this information about it.',
                      },
                      {
                        value:
                          matchingMeeting != null && matchingTime != null
                            ? moment
                                .duration(
                                  Math.abs(matchingTime.diff(startTime)),
                                )
                                .asSeconds() <= 60
                            : null,
                        label: 'Meeting time matches fair start time',
                        details:
                          matchingMeeting != null && matchingTime != null
                            ? `Your meeting is scheduled for ${matchingTime.format(
                                'LLL',
                              )} and your assigned fair slot is ${startTime.format(
                                'LLL',
                              )}`
                            : 'You must own the Zoom meeting to see this information about it.',
                      },
                      {
                        value:
                          matchingMeeting != null
                            ? !matchingMeeting.extra_details?.settings
                                ?.waiting_room
                            : null,
                        label: 'Meeting room disabled',
                        details:
                          'Having the meeting room disabled will make it easier for prospective members to join your meeting.',
                      },
                      {
                        value:
                          matchingMeeting?.extra_details?.settings
                            ?.mute_upon_entry,
                        label: 'Mute upon entry enabled',
                        details:
                          'You should mute newcomers by default to prevent any disruptions to your pitch.',
                      },
                      {
                        value:
                          matchingMeeting?.extra_details?.settings
                            ?.meeting_authentication,
                        label: 'Meeting authentication enabled',
                        details:
                          'You should enable meeting authentication so that only Penn students can join your meeting.',
                      },
                      {
                        value:
                          event.description.length > 3 &&
                          event.description !== 'Replace this description!',
                        label: 'Has meaningful description',
                        details: `Add some details about your ${OBJECT_NAME_SINGULAR} and information session to the event description. Booths with descriptions will appear above booths without descriptions.`,
                      },
                      {
                        value: !!event.image_url,
                        label: 'Has cover photo',
                        details:
                          'Add an eye-catching cover photo to encourage students to visit your booth! Booths with cover photos will appear above booths without cover photos.',
                      },
                    ]}
                  />
                </div>
                <p className="mt-3">
                  Click on{' '}
                  <b>{zoomId != null ? 'Fix Meeting' : 'Add Meeting'}</b> for us
                  to{' '}
                  {zoomId == null
                    ? 'create your Zoom meeting link for you'
                    : 'attempt to fix issues with your meeting'}
                  . Use the form below if you want to edit the cover photo and
                  description for your virtual {FAIR_NAME} fair booth.
                </p>
                <p className="mt-3">
                  Clicking the button below will also attempt to add all
                  {OBJECT_NAME_SINGULAR} officers who have linked their Zoom
                  accounts to {SITE_NAME} as co-hosts of the meeting.
                </p>
                <div className="mt-3 buttons">
                  <button
                    className="button is-small is-success"
                    disabled={isLoading || !zoomSettings.success}
                    onClick={() => {
                      setLoading(true)
                      doApiRequest(
                        `/settings/zoom/meetings/?format=json&event=${event.id}`,
                        { method: 'POST' },
                      )
                        .then((resp) => resp.json())
                        .then((resp) => {
                          toast[resp.success ? 'success' : 'error'](resp.detail)
                          loadEvents().then(setEvents)
                          loadMeetings(undefined, true)
                            .then(setUserMeetings)
                            .then(() => {
                              setLoading(false)
                            })
                        })
                        .catch(() => {
                          toast.error(
                            <>
                              An error occured while trying to add your meeting.
                              Please contact <Contact /> for assistance.
                            </>,
                          )
                          setLoading(false)
                        })
                    }}
                  >
                    {zoomId ? (
                      <>
                        <Icon name="settings" /> Fix Meeting
                      </>
                    ) : (
                      <>
                        <Icon name="plus" /> Add Meeting
                      </>
                    )}
                  </button>
                  {zoomId && (
                    <button
                      className="button is-small is-danger"
                      disabled={isLoading || !zoomSettings.success}
                      onClick={() => {
                        setLoading(true)
                        doApiRequest(
                          `/settings/zoom/meetings/?format=json&event=${event.id}`,
                          { method: 'DELETE' },
                        )
                          .then((resp) => resp.json())
                          .then((resp) => {
                            toast[resp.success ? 'success' : 'error'](
                              resp.detail,
                            )
                            loadEvents().then(setEvents)
                            loadMeetings(undefined, true)
                              .then(setUserMeetings)
                              .then(() => setLoading(false))
                          })
                          .catch(() => {
                            toast.error(
                              <>
                                An error occured while trying to delete your
                                meeting. Please contact <Contact /> for
                                assistance.
                              </>,
                            )
                            setLoading(false)
                          })
                      }}
                    >
                      <Icon name="trash" /> Remove Meeting
                    </button>
                  )}
                  <Link
                    href={CLUB_EDIT_ROUTE() + '#events'}
                    as={CLUB_EDIT_ROUTE(event.club as string) + '#events'}
                    className="button is-small is-secondary"
                    target="_blank"
                  >
                    <Icon name="edit" />
                    Edit Event
                  </Link>
                </div>
                <hr />
                <p className="mt-3">
                  You can use the form below to quickly edit the description and
                  cover photo fields for your event.
                </p>
                <Formik
                  initialValues={{
                    description: event.description,
                    image: event.image_url,
                  }}
                  onSubmit={async (data) => {
                    setLoading(true)
                    const body: { description: string; image?: null } = {
                      description: data.description,
                    }
                    if (typeof data.image !== 'string') {
                      if (data.image != null) {
                        const formData = new FormData()
                        formData.append('file', data.image)
                        await doApiRequest(
                          `/clubs/${event.club}/events/${event.id}/upload/?format=json`,
                          { method: 'POST', body: formData },
                        )
                      } else {
                        body.image = null
                      }
                    }
                    await doApiRequest(
                      `/clubs/${event.club}/events/${event.id}/?format=json`,
                      {
                        method: 'PATCH',
                        body,
                      },
                    )
                    loadEvents().then(setEvents)
                    setLoading(false)
                    toast.success(
                      'The description and cover photo for this event has been saved!',
                    )
                  }}
                  enableReinitialize
                >
                  <Form>
                    <Field
                      as={FileField}
                      name="image"
                      label="Cover Photo"
                      helpText="The cover photo for your fair event. We recommend a 16:9 image, preferrably 1920 x 1080."
                      isImage
                    />
                    <Field
                      as={RichTextField}
                      name="description"
                      helpText="A meaningful description about the information session. Can include next steps and application links."
                    />
                    <button
                      type="submit"
                      className="button is-success"
                      disabled={isLoading}
                    >
                      <Icon name="edit" /> Save Details
                    </button>
                  </Form>
                </Formik>
              </SmallEvent>
            )
          })}
        </div>
        <h3>
          4. Accessing your Meeting during the {FAIR_NAME_CAPITALIZED} Fair
        </h3>
        <p>
          If you do not already have the Zoom meeting software downloaded, you
          should download the Zoom meeting client{' '}
          <a href="https://zoom.us/download" target="_blank">
            here
          </a>
          . After you have installed the Zoom client, you should be presented
          with the login screen. If you are logged into another account that is
          not your Penn Zoom account, you should log out of the other account
          first.
        </p>
        <div className="columns">
          <div className="column has-text-centered">
            <img
              src="/static/img/screenshots/zoom_login_1.png"
              alt="Zoom Login Screen"
            />
            <div className="has-text-grey">
              Instead of logging in with a username or password, click on "Sign
              in with SSO".
            </div>
          </div>
          <div className="column has-text-centered">
            <img
              src="/static/img/screenshots/zoom_login_2.png"
              alt="Zoom SSO Screen"
            />
            <div className="has-text-grey">
              Use "<b>yourpennkey</b>@upenn.edu" to login, where "yourpennkey"
              is your PennKey.
            </div>
          </div>
        </div>
        <p>
          After you have logged in, navigate to the "Meetings" tab. Your meeting
          should appear on the left hand list with a name like "Virtual
          {FAIR_NAME_CAPITALIZED} Fair - {OBJECT_NAME_TITLE_SINGULAR} Name".
          Click "Start" to start the meeting.
        </p>
        <div className="has-text-centered">
          <img
            src="/static/img/screenshots/zoom_login_3.png"
            alt="Zoom Meeting Screen"
          />
        </div>
        <p>
          We recommend familiarizing yourself with breakout rooms before the
          fair and entering your meeting a few minutes before the fair starts.
          This is so that if you run into any technical difficulties, you have
          some time to resolve them.
        </p>
        <p>
          <b>🎉 That's it!</b> You should be set up for the virtual {FAIR_NAME}
          fair. If you have any questions or concerns, please email <Contact />.
        </p>
      </div>
    </Container>
  )
}

ZoomPage.getInitialProps = async (ctx: NextPageContext) => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [events, zoomSettings, userMeetings, fairs] = await Promise.all([
    loadEvents(data),
    loadSettings(false, false, data),
    loadMeetings(data),
    doApiRequest('/clubfairs/?format=json', data).then((resp) => resp.json()),
  ])

  return { events, zoomSettings, userMeetings, fairs }
}

export default renderPage(ZoomPage)
