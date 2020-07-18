import { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club } from '../../types'
import { doApiRequest, getApiUrl } from '../../utils'
import { Empty, Icon, Loading } from '../common'
import BaseCard from './BaseCard'

type SubscribersCardProps = {
  club: Club
}

type Subscription = {
  name: string
  email: string
  graduation_year: number
  school: {
    name: string
  }[]
  major: {
    name: string
  }[]
  created_at: string
}

export default function SubscribersCard({
  club,
}: SubscribersCardProps): ReactElement {
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(
    null,
  )

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/subscription/?format=json`)
      .then((resp) => resp.json())
      .then(setSubscriptions)
  }, [])

  return (
    <BaseCard title="Subscribers">
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Grad Year</th>
            <th>School</th>
            <th>Major</th>
            <th>Subscribed</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions !== null ? (
            subscriptions.map((item, i) => (
              <tr key={i}>
                <td>{item.name || <Empty>None</Empty>}</td>
                <td>{item.email || <Empty>None</Empty>}</td>
                <td>{item.graduation_year || <Empty>None</Empty>}</td>
                <td>
                  {item.school && item.school.length ? (
                    item.school.map((a) => a.name).join(', ')
                  ) : (
                    <Empty>None</Empty>
                  )}
                </td>
                <td>
                  {item.major && item.major.length ? (
                    item.major.map((a) => a.name).join(', ')
                  ) : (
                    <Empty>None</Empty>
                  )}
                </td>
                <td>
                  <TimeAgo date={item.created_at} />
                </td>
              </tr>
            ))
          ) : (
            <Loading />
          )}
          {(subscriptions !== null && !!subscriptions.length) || (
            <tr>
              <td colSpan={5} className="has-text-grey">
                No one has subscribed to this club yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="buttons">
        <a
          href={getApiUrl(`/clubs/${club.code}/subscription/?format=xlsx`)}
          className="button is-link"
        >
          <Icon alt="download" name="download" /> Download Subscriber List
        </a>
      </div>
    </BaseCard>
  )
}
