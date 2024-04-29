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
          <Link style={{ color: 'white' }} href={`/tickets/${id}`}>
            View
          </Link>
        </button>
      ),
    },
  ]

  const ticketEvents = club.events.filter((event) => event.ticketed)

  return (
    <BaseCard title="Tickets (beta)">
      {ticketEvents.length > 0 ? (
        <Table
          data={ticketEvents.map((item, index) =>
            item.id ? { ...item, id: item.id } : { ...item, id: index },
          )}
          columns={eventsTableFields}
          searchableColumns={['name']}
          filterOptions={[]}
          hideSearch
          focusable
        />
      ) : (
        <>
          You don't have any ticketed events. To create a ticketed event or add
          ticket offerings to existing events, go to{' '}
          <Link href={`/club/${club.code}/edit/events`}>Events</Link> within
          this dashboard and click "Create" in the tickets section below event
          details.
        </>
      )}
    </BaseCard>
  )
}
