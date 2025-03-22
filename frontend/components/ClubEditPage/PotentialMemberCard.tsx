import { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club } from '../../types'
import { doApiRequest, getApiUrl } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Empty, Icon, Loading } from '../common'
import BaseCard from './BaseCard'

type PotentialMemberCard = {
  club: Club
  header?: ReactElement<any>
  source?: 'subscription' | 'membershiprequests'
  actions?: {
    name: string
    onClick: (id: string) => Promise<void>
    className?: string
    icon?: string
  }[]
}

type Student = {
  username: string
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

/**
 * This card is used to handle displaying subscriptions, bookmarks, and membership requests on the club officer admin dashboard.
 */
export default function PotentialMemberCard({
  header,
  club,
  source = 'subscription',
  actions,
}: PotentialMemberCard): ReactElement<any> {
  const [students, setStudents] = useState<Student[] | null>(null)

  const reloadList = () => {
    doApiRequest(`/clubs/${club.code}/${source}/?format=json`)
      .then((resp) => resp.json())
      .then(setStudents)
  }

  useEffect(reloadList, [])

  if (students == null) {
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
      {header}
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Grad Year</th>
            <th>School</th>
            <th>Major</th>
            <th>Subscribed</th>
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((item, i) => (
            <tr key={i}>
              <td>{item.name || item.username || <Empty>None</Empty>}</td>
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
              {actions && (
                <td>
                  <div className="buttons">
                    {actions.map(
                      ({ name, onClick, className = 'is-primary', icon }) => (
                        <div
                          key={name}
                          className={`button ${className} is-small`}
                          onClick={() => {
                            onClick(item.username).then(() => {
                              reloadList()
                            })
                          }}
                        >
                          {icon && (
                            <>
                              <Icon name={icon} alt={name.toLowerCase()} />{' '}
                            </>
                          )}
                          {name}
                        </div>
                      ),
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {(students !== null && !!students.length) || (
            <tr>
              <td colSpan={actions ? 6 : 5} className="has-text-grey">
                No one has {pastVerb} to this {OBJECT_NAME_SINGULAR} yet.
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
