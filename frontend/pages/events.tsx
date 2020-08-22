import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { Metadata, Title, WideContainer } from '../components/common'
import EventCard from '../components/EventPage/EventCard'
import { CLUBS_GREY, mediaMaxWidth, PHONE, SNOW } from '../constants'
import renderPage from '../renderPage'
import { ClubEvent } from '../types'
import { doApiRequest } from '../utils'

interface EventPageProps {
  liveEvents: ClubEvent[]
  upcomingEvents: ClubEvent[]
}

const CardList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  ${mediaMaxWidth(PHONE)} {
    grid-template-columns: repeat(2, 1fr);
  }
`

function EventPage({
  upcomingEvents,
  liveEvents,
}: EventPageProps): ReactElement {
  return (
    <>
      <Metadata title="Events" />
      <WideContainer background={SNOW} fullHeight>
        <Title className="title" style={{ color: CLUBS_GREY }}>
          Live Events
        </Title>
        <CardList>
          {liveEvents.map((e) => (
            <EventCard key={e.id} event={e} isHappening={true} />
          ))}
        </CardList>
        <br />
        <Title className="title" style={{ color: CLUBS_GREY }}>
          Upcoming Events
        </Title>
        <CardList>
          {upcomingEvents.map((e) => (
            <EventCard key={e.id} event={e} isHappening={false} />
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
