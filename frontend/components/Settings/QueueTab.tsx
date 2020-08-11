import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../../constants'
import { Club } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import { Icon } from '../common'

const QueueTab = (): ReactElement => {
  const [canApprove, setCanApprove] = useState<boolean>(false)
  const [clubs, setClubs] = useState<Club[]>([])

  useEffect(() => {
    apiCheckPermission('approve_club').then((approved) => {
      setCanApprove(approved)
      if (approved) {
        doApiRequest('/clubs/?active=true&approved=none&format=json')
          .then((resp) => resp.json())
          .then((clubs) => {
            setClubs(clubs)
          })
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
                <span className="has-text-info">
                  <Icon name="clock" /> Pending Approval
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default QueueTab
