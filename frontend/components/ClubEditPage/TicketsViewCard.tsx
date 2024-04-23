import Link from 'next/link'
import React, { ReactElement } from 'react'

import { Club } from '~/types'

import Table from '../common/Table'
import BaseCard from './BaseCard'

export default function TicketsViewCard({
  club,
}: {
  club: Club
}): ReactElement {
  const eventsTableFields = [
    { label: 'Event Name', name: 'name' },
    {
      label: '',
      name: 'view',
      render: (id) => (
        <button className="button is-primary is-pulled-right">
          <Link style={{ color: 'white' }} href={'/tickets/' + id}>
            View
          </Link>
        </button>
      ),
    },
  ]

  // console.log(club.events)
  const ticketEvents = club.events.filter((event) => event.ticketed)

  return (
    <BaseCard title="Tickets">
      {ticketEvents.length > 0 ? (
        <Table
          data={ticketEvents.map((item, index) =>
            item.id ? { ...item, id: item.id } : { ...item, id: index },
          )}
          columns={eventsTableFields}
          searchableColumns={['name']}
          filterOptions={[]}
          hideSearch={true}
          focusable={true}
        />
      ) : (
        <>
          You don't have any ticketed events, to add create ticketed events or
          add ticket offerings, to existing events, go to the events, click
          create on the tickets section below the event details.
        </>
      )}
    </BaseCard>
  )
}
