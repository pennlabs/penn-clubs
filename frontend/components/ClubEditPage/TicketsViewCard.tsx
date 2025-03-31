import moment from 'moment'
import Link from 'next/link'
import React, { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Club, EventGroup } from '~/types'

import { Icon } from '../common'
import BaseCard from './BaseCard'

const EventGroupSection = styled.div`
  margin-bottom: 1rem;
`

const EventGroupHeader = styled.div`
  cursor: pointer;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background-color: #eee;
  }
`

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    font-weight: bold;
    background-color: #f9f9f9;
  }
`

const SectionTitle = styled.h3`
  margin: 1.5rem 0 1rem 0;
  font-size: 1.2rem;
  font-weight: bold;
`

interface EventGroupRowProps {
  eventGroup: EventGroup
  isOpen: boolean
  onToggle: () => void
}

const EventGroupRow = ({
  eventGroup,
  isOpen,
  onToggle,
}: EventGroupRowProps) => {
  const ticketedEvents = eventGroup.events.filter((event) => event.ticketed)

  return (
    <EventGroupSection>
      <EventGroupHeader onClick={onToggle}>
        <span>
          {eventGroup.name} ({ticketedEvents.length} ticketed event
          {ticketedEvents.length !== 1 ? 's' : ''})
        </span>
        <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} />
      </EventGroupHeader>
      {isOpen && (
        <SimpleTable>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ticketedEvents.map((event) => (
              <tr key={event.id}>
                <td>{moment(event.start_time).format('MMM D, YYYY h:mm A')}</td>
                <td>{event.location || 'No location specified'}</td>
                <td>
                  <Link href={`/events/${eventGroup.code}/tickets/${event.id}`}>
                    <button className="button is-small is-primary">
                      View Tickets
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </SimpleTable>
      )}
    </EventGroupSection>
  )
}

export default function TicketsViewCard({
  club,
}: {
  club: Club
}): ReactElement {
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())

  const toggleGroup = (groupId: number) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(groupId)) {
      newOpenGroups.delete(groupId)
    } else {
      newOpenGroups.add(groupId)
    }
    setOpenGroups(newOpenGroups)
  }

  const now = moment()
  const ticketedGroups =
    club.event_groups?.filter((group) =>
      group.events.some((event) => event.ticketed),
    ) || []

  const upcomingGroups = ticketedGroups.filter((group) =>
    group.events.some((event) => moment(event.end_time).isAfter(now)),
  )

  const pastGroups = ticketedGroups.filter((group) =>
    group.events.every((event) => moment(event.end_time).isSameOrBefore(now)),
  )

  if (ticketedGroups.length === 0) {
    return (
      <BaseCard title="Tickets (beta)">
        You don't have any ticketed events. To create a ticketed event or add
        ticket offerings to existing events, go to{' '}
        <Link href={`/club/${club.code}/edit/events`}>Events</Link> within this
        dashboard and click "Create" in the tickets section below event details.
      </BaseCard>
    )
  }

  return (
    <BaseCard title="Tickets (beta)">
      {upcomingGroups.length > 0 && (
        <>
          <SectionTitle>Upcoming Events</SectionTitle>
          {upcomingGroups.map((group) => (
            <EventGroupRow
              key={group.id}
              eventGroup={group}
              isOpen={openGroups.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </>
      )}

      {pastGroups.length > 0 && (
        <>
          <SectionTitle>Past Events</SectionTitle>
          {pastGroups.map((group) => (
            <EventGroupRow
              key={group.id}
              eventGroup={group}
              isOpen={openGroups.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </>
      )}
    </BaseCard>
  )
}
