import { ReactElement, useEffect, useMemo, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club } from '../../types'
import { doApiRequest, getApiUrl } from '../../utils'
import { Empty, Icon, Loading } from '../common'
import Table from '../common/Table'
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

  const title =
    source === 'subscription' ? 'Subscribers' : 'Membership Requests'
  const multiNoun =
    source === 'subscription' ? 'Subscriber' : 'Membership Request'

  const studentColumns = useMemo(
    () => [
      {
        name: 'name',
        label: 'Name',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item?.name || item?.username || <Empty>None</Empty>
        },
      },
      {
        name: 'email',
        label: 'Email',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item?.email || <Empty>None</Empty>
        },
      },
      {
        name: 'graduation_year',
        label: 'Grad Year',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item?.graduation_year || <Empty>None</Empty>
        },
      },
      {
        name: 'schoolDisplay',
        label: 'School',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item?.school && item.school.length ? (
            item.school.map((a) => a.name).join(', ')
          ) : (
            <Empty>None</Empty>
          )
        },
      },
      {
        name: 'majorDisplay',
        label: 'Major',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item?.major && item.major.length ? (
            item.major.map((a) => a.name).join(', ')
          ) : (
            <Empty>None</Empty>
          )
        },
      },
      {
        name: 'created_at',
        label: 'Subscribed',
        render: (id) => {
          const item = students?.find((student) => student.username === id)
          return item ? <TimeAgo date={item.created_at} /> : null
        },
      },
      ...(actions
        ? [
            {
              name: 'Actions',
              render: (id) => {
                const item = students?.find(
                  (student) => student.username === id,
                )
                if (item == null) {
                  return null
                }
                return (
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
                )
              },
            },
          ]
        : []),
    ],
    [actions, students],
  )

  const studentData = useMemo(
    () =>
      (students ?? []).map((item) => ({
        ...item,
        id: item.username,
        schoolDisplay:
          item.school && item.school.length
            ? item.school.map((a) => a.name).join(', ')
            : '',
        majorDisplay:
          item.major && item.major.length
            ? item.major.map((a) => a.name).join(', ')
            : '',
      })),
    [students],
  )

  if (students == null) {
    return <Loading />
  }

  return (
    <BaseCard title={title}>
      {header}
      <Table
        data={studentData}
        columns={studentColumns}
        searchableColumns={['name', 'email', 'schoolDisplay', 'majorDisplay']}
      />
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
