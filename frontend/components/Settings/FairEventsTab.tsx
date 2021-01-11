import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../../constants'
import { ClubFair } from '../../types'
import { doApiRequest } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon, Loading, Text } from '../common'

type Props = {
  fairs?: ClubFair[]
}

type FairEvent = {
  code: string
  name: string
  meetings: string[]
}

const BoolIndicator = ({ value }: { value: boolean }): ReactElement => {
  return (
    <span className={value ? 'has-text-success' : 'has-text-danger'}>
      <Icon name={value ? 'check' : 'x'} />
    </span>
  )
}

const FairEventsTab = ({ fairs: initialFairs }: Props): ReactElement => {
  const [fairs, setFairs] = useState<ClubFair[] | { detail: string } | null>(
    initialFairs ?? null,
  )
  const [selectedFair, setSelectedFair] = useState<number | null>(
    fairs != null && !('detail' in fairs) && fairs.length > 0
      ? fairs[0].id
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
            setSelectedFair(data[0].id)
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
        registered {OBJECT_NAME_PLURAL} for an activities fair. Only users with
        the required permissions can view this page.
      </Text>
      <div className="select is-fullwidth mb-5">
        <select onChange={(e) => setSelectedFair(parseInt(e.target.value))}>
          {fairs.map((fair) => (
            <option key={fair.id} value={fair.id}>
              {fair.name}
            </option>
          ))}
        </select>
      </div>
      {fairEvents != null ? (
        'detail' in fairEvents ? (
          <Text>{fairEvents.detail}</Text>
        ) : (
          <div className="content">
            <table>
              <thead>
                <tr>
                  <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                  <th>Has Event</th>
                  <th>Has Meeting Link</th>
                </tr>
              </thead>
              <tbody>
                {fairEvents.map((event, i) => (
                  <tr key={i}>
                    <td>
                      <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.code)}>
                        {event.name}
                      </Link>
                    </td>
                    <td>
                      <BoolIndicator value={event.meetings.length > 0} />
                    </td>
                    <td>
                      <BoolIndicator
                        value={
                          event.meetings.length > 0 &&
                          event.meetings.every(
                            (meet) => meet && meet.length > 0,
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
                {fairEvents.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      There are no {OBJECT_NAME_PLURAL} registered for this
                      activities fair.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <Loading />
      )}
    </>
  )
}

export default FairEventsTab
