
import { doApiRequest } from "~/utils"
import type { InferGetServerSidePropsType } from 'next'
import React from "react"
import { ClubEvent, PagedResponse } from "~/types"
import { DateTime } from "luxon"
 
export const getServerSideProps = async () => {
  const beginningOfToday = DateTime.now().startOf('day')
  const params = new URLSearchParams({
    page: String(1),
    page_size: String(2),
    ordering: 'start_time',
    start_time__gte: beginningOfToday.toISODate({
      format: "extended"
    }),
    format: "json"
  });
  const eventsResponse = await doApiRequest(`/events/?${params.toString()}`)
  const eventsData: PagedResponse<ClubEvent> = await eventsResponse.json()
  const {results: events } = eventsData
  return {
    props: {events},
  }
}

const NavigationBar: React.FC = () => {
  return (
    <nav>
      <h1>Events</h1>
    </nav>
  )
}
 
const Page: React.FC<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  events
}) => {
  return (events.map((event) => (
    <div key={event.id}>
      <h1>{event.name}</h1>
      <p>{event.description}</p>
      <p>{event.start_time}</p>
    </div>
  )))
}


export default Page