import React, { ReactElement } from 'react'
import { NextPageContext } from 'next'
import { Metadata } from '../components/common/Metadata'
import { doApiRequest } from '../utils'
import { Club, ClubEvent } from '../types'
import { WideContainer } from '../components/common/Container'
import { CLUBS_GREY, SNOW } from '../constants/colors'
import { Title } from '../components/common/Typography'
import renderPage from '../renderPage'
import styled from 'styled-components'
import { mediaMaxWidth, mediaMinWidth, PHONE } from '../constants/measurements'
import Link from 'next/link'

interface EventPageProps {
  liveEvents: ClubEvent[]
  upcomingEvents: ClubEvent[]
}

const EventCard = (props: { event: ClubEvent }) => {
  const { event } = props

  return (
    <div>
      <ul>
        <li>{event.name}</li>
        <li>
          <Link href={'/club/[club]/'} as={`/club/${event.club}`}>
            <a>{event.club_name}</a>
          </Link>
        </li>
        <li>{new Date(event.start_time).toLocaleString()}</li>
        <li>{new Date(event.end_time).toLocaleString()}</li>
      </ul>
    </div>
  )
}

const CardList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  ${mediaMaxWidth(PHONE)} {
    grid-template-columns: repeat(2, 1fr);
  }
`

function EventPage(props: EventPageProps): ReactElement {
  const { upcomingEvents, liveEvents } = props
  return (
    <>
      <Metadata title="Events" />
      <WideContainer background={SNOW} fullHeight>
        <Title className="title" style={{ color: CLUBS_GREY }}>
          Live Events
        </Title>
        <CardList>
          {liveEvents.map((e) => (
            <EventCard event={e} />
          ))}
        </CardList>
        <br />
        <Title className="title" style={{ color: CLUBS_GREY }}>
          Upcoming Events
        </Title>
        <CardList>
          {upcomingEvents.map((e) => (
            <EventCard event={e} />
          ))}
        </CardList>
      </WideContainer>
    </>
  )
}

EventPage.getInitialProps = async (
  ctx: NextPageContext,
): Promise<EventPageProps> => {
  const { req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const liveEvents = (await doApiRequest('/events/live/', data).then((res) =>
    res.json(),
  )) as ClubEvent[]

  const upcomingEvents = (await doApiRequest(
    '/events/upcoming/',
    data,
  ).then((res) => res.json())) as ClubEvent[]

  return { liveEvents, upcomingEvents }
}

export default renderPage(EventPage)
