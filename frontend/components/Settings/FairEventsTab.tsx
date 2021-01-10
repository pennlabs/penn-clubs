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
  fairs: ClubFair[]
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

const FairEventsTab = ({ fairs }: Props): ReactElement => {
  const [selectedFair, setSelectedFair] = useState<number | null>(
    fairs.length > 0 ? fairs[0].id : null,
  )
  const [fairEvents, setFairEvents] = useState<FairEvent[] | null>(null)

  useEffect(() => {
    if (selectedFair != null) {
      setFairEvents(null)
      doApiRequest(`/clubfairs/${selectedFair}/events/?format=json`)
        .then((resp) => resp.json())
        .then((data) => setFairEvents(data))
    }
  }, [selectedFair])

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
                        event.meetings.every((meet) => meet && meet.length > 0)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Loading />
      )}
    </>
  )
}

export default FairEventsTab
