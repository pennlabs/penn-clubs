import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE, FAIR_INFO_ROUTE, LIVE_EVENTS } from '../../constants'
import { ClubFair } from '../../types'
import { doApiRequest } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  FAIR_NAME,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from '../../utils/branding'
import { Icon, Loading, Text } from '../common'
import { ColumnTooltip } from './ClubTabTable'

type Props = {
  fairs?: ClubFair[]
  fair?: number
}

type FairEvent = {
  code: string
  name: string
  approved: boolean
  meetings: string[]
  badges: string[]
}

const BoolIndicator = ({ value }: { value: boolean }): ReactElement<any> => {
  return (
    <span className={value ? 'has-text-success' : 'has-text-danger'}>
      <Icon name={value ? 'check' : 'x'} />
    </span>
  )
}

const FairEventsTab = ({
  fairs: initialFairs,
  fair: initialSelection,
}: Props): ReactElement<any> => {
  const [fairs, setFairs] = useState<ClubFair[] | { detail: string } | null>(
    initialFairs ?? null,
  )
  const [selectedFair, setSelectedFair] = useState<number | null>(
    fairs != null && !('detail' in fairs) && fairs.length > 0
      ? (initialSelection ?? fairs[0].id)
      : null,
  )
  const [fairEvents, setFairEvents] = useState<
    FairEvent[] | { detail: string } | null
  >(null)

  useEffect(() => {
    if (fairs == null) {
      doApiRequest('/clubfairs/?format=json')
        .then((resp) => resp.json())
        .then((data) => {
          setFairs(data)
          if (selectedFair == null && data.length > 0) {
            setSelectedFair(initialSelection ?? data[0].id)
          }
        })
    }
  }, [fairs])

  useEffect(() => {
    if (selectedFair != null) {
      setFairEvents(null)
      doApiRequest(`/clubfairs/${selectedFair}/events/?format=json`)
        .then((resp) => resp.json())
        .then((data) => setFairEvents(data))
    }
  }, [selectedFair])

  if (fairs == null) {
    return <Loading />
  }

  if ('detail' in fairs) {
    return <Text>{fairs.detail}</Text>
  }

  return (
    <>
      <Text>
        This is a dashboard where you can view the status and events for all
        registered {OBJECT_NAME_PLURAL} for an {FAIR_NAME} fair. Only users with
        the required permissions can view this page.
      </Text>
      <div className="select is-fullwidth mb-5">
        <select
          value={selectedFair ?? undefined}
          onChange={(e) => setSelectedFair(parseInt(e.target.value))}
        >
          {fairs.map((fair) => (
            <option key={fair.id} value={fair.id}>
              {fair.name}
            </option>
          ))}
        </select>
      </div>
      {fairEvents != null && !('detail' in fairEvents) && (
        <>
          <div className="buttons mb-2">
            <Link
              legacyBehavior
              href={`${FAIR_INFO_ROUTE}?fair=${selectedFair}`}
            >
              <a className="button is-link is-small">
                <Icon name="eye" />
                Preview Info Page
              </a>
            </Link>
            <Link
              href={`${LIVE_EVENTS}?fair=${selectedFair}`}
              className="button is-link is-small"
            >
              <Icon name="eye" />
              Preview Events Page
            </Link>
          </div>
          <Text>
            There are {fairEvents.length} {OBJECT_NAME_PLURAL} in this
            {FAIR_NAME} fair.
          </Text>
        </>
      )}
      {fairEvents != null ? (
        'detail' in fairEvents ? (
          <Text>{fairEvents.detail}</Text>
        ) : (
          <div className="content">
            <table className="table is-hoverable">
              <thead>
                <tr>
                  <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                  <th>Categories</th>
                  <th>
                    Approved{' '}
                    <ColumnTooltip
                      tip={`Shows whether or not this ${OBJECT_NAME_SINGULAR} has been approved by the ${APPROVAL_AUTHORITY}. Only the ${APPROVAL_AUTHORITY} can change this.`}
                    />
                  </th>
                  <th>
                    Has Event{' '}
                    <ColumnTooltip
                      tip={`Shows whether or not an event has been created for this ${OBJECT_NAME_SINGULAR}. Only ${SITE_NAME} administrators can do this.`}
                    />
                  </th>
                  <th>
                    Has Meeting Link{' '}
                    <ColumnTooltip
                      tip={`Shows whether or not the meeting link has been properly configured. Only ${OBJECT_NAME_SINGULAR} officers can do this.`}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {fairEvents.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <Link
                        legacyBehavior
                        href={CLUB_ROUTE()}
                        as={CLUB_ROUTE(event.code)}
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td>
                      {event.badges.join(', ') || (
                        <span className="has-text-danger">None</span>
                      )}
                    </td>
                    <td>
                      <BoolIndicator value={event.approved} />
                    </td>
                    <td>
                      <BoolIndicator value={event.meetings.length > 0} />{' '}
                      {event.meetings.length > 1 && (
                        <span className="has-text-link">
                          {' '}
                          ({event.meetings.length})
                        </span>
                      )}
                    </td>
                    <td>
                      <BoolIndicator
                        value={
                          event.meetings.length > 0 &&
                          event.meetings.every(
                            (meet) => meet && meet.length > 0,
                          )
                        }
                      />{' '}
                      {event.meetings.length > 1 && (
                        <span className="has-text-link">
                          {' '}
                          (
                          {
                            event.meetings.filter((mt) => mt && mt.length > 0)
                              .length
                          }
                          /{event.meetings.length})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {fairEvents.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      There are no {OBJECT_NAME_PLURAL} registered for this
                      {FAIR_NAME} fair.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : fairs.length > 0 ? (
        <Loading />
      ) : (
        <Text>There are no {FAIR_NAME} fairs to display.</Text>
      )}
    </>
  )
}

export default FairEventsTab
