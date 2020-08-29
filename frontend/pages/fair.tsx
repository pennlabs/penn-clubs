import moment from 'moment'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'

import { Container, Icon, InfoPageTitle, Metadata } from '../components/common'
import { CLUB_ROUTE, LIVE_EVENTS, SNOW } from '../constants'
import renderPage from '../renderPage'
import { ClubEvent, ClubEventType } from '../types'
import { doApiRequest, useSetting } from '../utils'

type FairPageProps = {
  events: ClubEvent[]
}

const FairPage = ({ events }: FairPageProps): ReactElement => {
  const isFairOpen = useSetting('FAIR_OPEN')
  const eventsByDay = {}

  events.forEach((item) => {
    const startTimestamp = new Date(item.start_time).getTime()
    const category =
      item.badges
        .filter(({ purpose }) => purpose === 'fair')
        .map(({ label }) => label)[0] ?? 'Miscellaneous'

    if (!(startTimestamp in eventsByDay)) {
      eventsByDay[startTimestamp] = {}
    }
    if (!(category in eventsByDay[startTimestamp])) {
      eventsByDay[startTimestamp][category] = []
    }
    eventsByDay[startTimestamp][category].push(item)
  })

  return (
    <Container background={SNOW}>
      <Metadata title="Virtual Activities Fair" />
      <InfoPageTitle>SAC Virtual Activities Fair</InfoPageTitle>
      <div className="content">
        <p>
          <b>How the SAC Fair will be run:</b>
        </p>
        <ul>
          <li>
            The SAC Fair will be held on <b>September 1 - 3</b> from{' '}
            <b>5pm to 8pm</b> on each of the three days.
          </li>
          <li>
            The main fair functionality is each club's informational Zoom
            meeting, which will all be visible on our{' '}
            <a href="https://pennclubs.com/events">Live Events Page</a>.
            Representatives of each club will be available in these meetings to
            answer questions, give short presentations, and otherwise interact
            with students.
          </li>
          <li>
            You can also visit each club's individual page. Each club's page has
            a description, contact information, and a FAQ feature that club
            officers will be monitoring throughout the fair that you can use to
            ask questions. Questions can be submitted anonymously.
          </li>
          {/* <li>
            To keep track of clubs you are interested in, we encourage you to
            use some of the tools on our platform!
            <ul>
              <li>
                The <b>Bookmark</b> button will allow you to save a club for
                later for your own personal reference.
              </li>
              <li>
                The <b>Subscribe</b> button will put your name on a club's
                mailing list. Club officers can use it to send you updates on
                their application process, upcoming meetings, and more.
              </li>
            </ul>
          </li> */}
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
            highly encourage you to do so, to take advantage of all features.
            Click <a href="https://zoom.us/download">here</a> to download the
            desktop client.
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
            If you have any questions or concerns regarding the SAC Fair, please
            contact{' '}
            <a href="mailto:sacfair@sacfunded.net">sacfair@sacfunded.net</a>.
          </li>
          <li>
            If you have any questions or concerns regarding the Penn Clubs
            platform, please contact{' '}
            <a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a>.
          </li>
        </ul>

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
          {Object.entries(eventsByDay)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(
              ([day, events]: [
                string,
                { [category: string]: ClubEvent[] },
              ]): ReactElement => {
                const parsedDate = moment(parseInt(day))
                const endDate = moment(Object.values(events)[0][0].end_time)
                return (
                  <div key={day} className="column">
                    <div className="mb-3">
                      <b className="has-text-info">
                        {parsedDate.format('LLL')} - {endDate.format('LT')}
                      </b>
                    </div>
                    {Object.entries(events)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([category, list]) => (
                        <>
                          <b>{category}</b>
                          <ul className="mt-0 mb-3">
                            {list
                              .sort((a, b) =>
                                a.club_name.localeCompare(b.club_name),
                              )
                              .map((event) => (
                                <li key={event.club}>
                                  <Link
                                    href={CLUB_ROUTE()}
                                    as={CLUB_ROUTE(event.club)}
                                  >
                                    <a>{event.club_name}</a>
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        </>
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

  const resp = await doApiRequest(
    `/events/?format=json&type=${ClubEventType.FAIR}`,
    data,
  )
  const json = await resp.json()

  return { events: json }
}

export default renderPage(FairPage)
