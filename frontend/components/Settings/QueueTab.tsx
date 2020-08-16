import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../../constants'
import { Club } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import { Icon } from '../common'

type QueueTableProps = {
  clubs: Club[] | null
}

const QueueTable = ({ clubs }: QueueTableProps): ReactElement => {
  if (clubs === null) {
    return <div className="has-text-info">Loading table...</div>
  }

  if (!clubs.length) {
    return (
      <div className="has-text-info">There are no clubs in this table.</div>
    )
  }

  return (
    <table className="table is-fullwidth">
      <thead>
        <tr>
          <th>Club</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {clubs.map((club) => (
          <tr key={club.code}>
            <td>
              <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
                <a target="_blank">{club.name}</a>
              </Link>
            </td>
            <td>
              {club.approved === null && (
                <span className="has-text-info">
                  <Icon name="clock" /> Pending Approval
                </span>
              )}
              {club.approved === false && (
                <span className="has-text-danger">
                  <Icon name="x" /> Rejected
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const QueueTab = (): ReactElement => {
  const [canApprove, setCanApprove] = useState<boolean>(false)
  const [clubs, setClubs] = useState<Club[] | null>(null)
  const [rejectedClubs, setRejectedClubs] = useState<Club[] | null>(null)

  useEffect(() => {
    apiCheckPermission('clubs.approve_club').then((approved) => {
      setCanApprove(approved)
      if (approved) {
        doApiRequest('/clubs/?active=true&approved=none&format=json')
          .then((resp) => resp.json())
          .then(setClubs)

        doApiRequest('/clubs/?active=true&approved=false&format=json')
          .then((resp) => resp.json())
          .then(setRejectedClubs)
      }
    })
  }, [])

  if (!canApprove) {
    return <div>Nothing to see here!</div>
  }

  return (
    <>
      <div className="mb-3">
        As an administrator of Penn Clubs, you can approve and reject club
        approval requests. The table below contains a list of clubs pending your
        approval. Click on the club name to view the club.
      </div>
      <QueueTable clubs={clubs} />
      <div className="mt-3 mb-3">
        The table below shows a list of clubs that have been marked as rejected.
      </div>
      <QueueTable clubs={rejectedClubs} />
    </>
  )
}

export default QueueTab
