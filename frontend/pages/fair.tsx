import moment from 'moment-timezone'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'

import {
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
} from '../components/common'
import { CLUB_ROUTE, FAIR_INFO, LIVE_EVENTS, SNOW } from '../constants'
import renderPage from '../renderPage'
import { doApiRequest, useSetting } from '../utils'

type FairPageProps = {
  events: {
    start_time: string
    end_time: string
    events: {
      category: string | null
      events: { name: string; code: string }[]
    }[]
  }[]
}

const FairPage = ({ events }: FairPageProps): ReactElement => {
  const isFairOpen = useSetting('FAIR_OPEN')
  const fairName = useSetting('FAIR_NAME')

  if (fairName == null) {
    return (
      <p className="has-text-danger">Fair setup is not configured correctly.</p>
    )
  }

  const fairInfo = FAIR_INFO[fairName as string]

  return (
    <Container background={SNOW}>
      <Metadata title={fairInfo.name} />
      <InfoPageTitle>{fairInfo.name} – Student Guide</InfoPageTitle>
      <div className="content">
        <p>
          <b>Hi there! Welcome to Penn Clubs!</b> We are the official platform
          for student organizations on campus, and we are excited to get you
          connected to clubs on our platform this year. In collaboration with
          the {fairInfo.organization}, we will be hosting the virtual club fair
          this fall. Below is some important information that will set you up
          for a successful experience.
        </p>
        <p>
          <b>How the {fairInfo.name} will be run:</b>
        </p>
        <ul>
          <li>
            The {fairInfo.name} will be held on <b>{fairInfo.time}</b>.
          </li>
          <li>
            The main fair functionality is each club's informational Zoom
            meeting, which will all be visible on our{' '}
            {isFairOpen ? (
              <a href="https://pennclubs.com/events">Live Events Page</a>
            ) : (
              'Live Events Page'
            )}
            . Representatives of each club will be available in these meetings
            to answer questions, give short presentations, and otherwise
            interact with students.
          </li>
          <li>
            You can also visit each club's individual page. Each club's page has
            a description, contact information, and a FAQ feature that club
            officers will be monitoring throughout the fair that you can use to
            ask questions. Questions can be submitted anonymously.
          </li>
          <li>
            To keep track of clubs you are interested in, we encourage you to
            use some of the tools on our platform!
            <ul>
              <li>
                The{' '}
                <b>
                  <Icon name="bookmark" /> Bookmark
                </b>{' '}
                button will allow you to save a club for later for your own
                personal reference. Clubs will not be able to see your contact
                information unless you have allowed it.
              </li>
              <li>
                The{' '}
                <b>
                  <Icon name="bell" /> Subscribe
                </b>{' '}
                button will put your name on a club's mailing list. Club
                officers can use this list to send you updates on their
                application process, upcoming meetings, and more.
              </li>
            </ul>
          </li>
        </ul>

        <p>
          <b>Configuring Zoom:</b>
        </p>
        <ul>
          <li>
            If you have not already activated your Zoom account, click "Sign in"
            at <a href="https://upenn.zoom.us/">this link</a> and sign in with
            your PennKey. You will not be able to attend any of the live events
            without signing in to your Zoom account.
          </li>
          <li>
            If you have not already downloaded the Zoom desktop client, we
            highly encourage you to do so to take advantage of all Zoom
            features. Click <a href="https://zoom.us/download">here</a> to
            download the desktop client.
          </li>
        </ul>
        <p>
          <b>Code of Conduct:</b>
        </p>
        <ul>
          <li>
            Please be respectful in attending information sessions. If the
            session is busy with many attendees, allow each other to take turns
            asking questions. Where appropriate, use the 'raise hand' feature to
            reduce interruptions.
          </li>
          <li>
            Please use appropriate language in the chat windows on Zoom. There
            will be peer to peer monitoring, ensuring that student participants
            and club members are not misusing any features during these
            sessions.
          </li>
        </ul>
        <p>
          <b>Contact:</b>
        </p>
        <ul>
          <li>
            If you have any questions or concerns regarding the {fairInfo.name},
            please contact <Contact email={fairInfo.contact} />.
          </li>
          <li>
            If you have any questions or concerns regarding the Penn Clubs
            platform, please contact <Contact />.
          </li>
        </ul>

        {fairInfo.additionalInformation && fairInfo.additionalInformation()}

        <p>
          You can find the schedule for the activities fair in the table below.
        </p>

        {isFairOpen && (
          <Link href={LIVE_EVENTS} as={LIVE_EVENTS}>
            <a className="button is-primary">
              <Icon name="chevrons-right" /> Go to events
            </a>
          </Link>
        )}
        <div className="columns mt-3">
          {events.map(
            ({ start_time, end_time, events }, i): ReactElement => {
              const parsedDate = moment(start_time).tz('America/New_York')
              const endDate = moment(end_time).tz('America/New_York')
              return (
                <div key={i} className="column">
                  <div className="mb-3">
                    <b className="has-text-info">
                      {parsedDate.format('LLL')} - {endDate.format('LT z')}
                    </b>
                  </div>
                  {events.map(({ category, events }) => (
                    <div key={category}>
                      <b>{category}</b>
                      <ul className="mt-0 mb-3">
                        {events.map((event) => (
                          <li key={event.code}>
                            <Link
                              href={CLUB_ROUTE()}
                              as={CLUB_ROUTE(event.code)}
                            >
                              <a>{event.name}</a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            },
          )}
        </div>
      </div>
    </Container>
  )
}

FairPage.getInitialProps = async (ctx: NextPageContext) => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const resp = await doApiRequest('/events/fair/?format=json', data)
  const json = await resp.json()

  return { events: json }
}

export default renderPage(FairPage)
