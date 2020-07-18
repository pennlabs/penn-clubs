import { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club } from '../../types'
import { doApiRequest, getApiUrl } from '../../utils'
import { Empty, Icon, Loading } from '../common'
import BaseCard from './BaseCard'

type PotentialMemberCard = {
  club: Club
  source?: 'subscription' | 'membershiprequests'
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

export default function PotentialMemberCard({
  club,
  source = 'subscription',
}: PotentialMemberCard): ReactElement {
  const [students, setStudents] = useState<Subscription[] | null>(null)

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/${source}/?format=json`)
      .then((resp) => resp.json())
      .then(setStudents)
  }, [])

  if (students === null) {
    return <Loading />
  }

  const title =
    source === 'subscription' ? 'Subscribers' : 'Membership Requests'
  const pastVerb =
    source === 'subscription' ? 'subscribed' : 'requested membership'
  const multiNoun =
    source === 'subscription' ? 'Subscriber' : 'Membership Request'

  return (
    <BaseCard title={title}>
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
          {students.map((item, i) => (
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
          ))}
          {(students !== null && !!students.length) || (
            <tr>
              <td colSpan={5} className="has-text-grey">
                No one has {pastVerb} to this club yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="buttons">
        <a
          href={getApiUrl(`/clubs/${club.code}/${source}/?format=xlsx`)}
          className="button is-link is-small"
        >
          <Icon alt="download" name="download" /> Download {multiNoun} List
        </a>
      </div>
    </BaseCard>
  )
}
