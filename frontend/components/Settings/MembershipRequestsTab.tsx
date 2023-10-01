import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../../constants'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_PLURAL } from '../../utils/branding'
import { Loading } from '../common'

type MembershipRequest = {
  club: string
  club_name: string
}

const MembershipRequestsTab = (): ReactElement => {
  const [requests, setRequests] = useState<MembershipRequest[] | null>(null)

  const fetchTable = (): void => {
    doApiRequest('/requests/?format=json')
      .then((resp) => resp.json())
      .then(setRequests)
  }

  useEffect(() => {
    fetchTable()
  }, [])

  if (requests === null) {
    return <Loading />
  }

  const withdrawRequest = (code: string): void => {
    doApiRequest(`/requests/${code}/?format=json`, { method: 'DELETE' }).then(
      fetchTable,
    )
  }

  return (
    <div>
      <p>
        The list below contains all of the {OBJECT_NAME_PLURAL} you have
        submitted membership requests to. Requests that have already been
        accepted or denied will not be shown on this list.
      </p>
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Club</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.club}>
              <td>
                <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(req.club)}>
                  {req.club_name}
                </Link>
              </td>
              <td>
                <button
                  className="button is-small"
                  onClick={() => withdrawRequest(req.club)}
                >
                  Withdraw
                </button>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={2}>
                You have not submitted membership requests for any{' '}
                {OBJECT_NAME_PLURAL}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default MembershipRequestsTab
