import moment from 'moment'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'

import { Container, Icon, InfoPageTitle, Metadata } from '../components/common'
import { CLUB_ROUTE, LIVE_EVENTS, SNOW } from '../constants'
import renderPage from '../renderPage'
import { ClubEvent, ClubEventType } from '../types'
import { doApiRequest } from '../utils'

type FairPageProps = {
  events: ClubEvent[]
}

const FairPage = ({ events }: FairPageProps): ReactElement => {
  const eventsByDay = {}

  events.forEach((item) => {
    const startTimestamp = new Date(item.start_time).getTime()
    if (!(startTimestamp in eventsByDay)) {
      eventsByDay[startTimestamp] = []
    }
    eventsByDay[startTimestamp].push(item)
  })

  return (
    <Container background={SNOW}>
      <Metadata title="Virtual Activities Fair" />
      <InfoPageTitle>SAC Virtual Activities Fair</InfoPageTitle>
      <div className="content">
        <p>
          The Student Activities Council Virtual Activities Fair will be held on{' '}
          <b>September 1 - 3</b> from <b>5pm to 8pm</b> on each of the three
          days. The event will be held virtually over Zoom.
        </p>
        <p>
          You can find the schedule for the activities fair below. Click on the
          button below to view current events.
        </p>
        <Link href={LIVE_EVENTS} as={LIVE_EVENTS}>
          <a className="button is-primary">
            <Icon name="chevrons-right" /> Go to events
          </a>
        </Link>
        <div className="columns mt-3">
          {Object.entries(eventsByDay).map(
            ([day, events]: [string, ClubEvent[]]): ReactElement => {
              const parsedDate = moment(parseInt(day))
              const endDate = moment(events[0].end_time)
              return (
                <div key={day} className="column">
                  <b>
                    {parsedDate.format('LLL')} - {endDate.format('LT')}
                  </b>
                  <ul>
                    {events
                      .sort((a, b) => a.club_name.localeCompare(b.club_name))
                      .map((event) => (
                        <li key={event.club}>
                          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.club)}>
                            <a>{event.club_name}</a>
                          </Link>
                        </li>
                      ))}
                  </ul>
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
