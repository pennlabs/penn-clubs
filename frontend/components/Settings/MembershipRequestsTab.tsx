import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_ROUTE } from '../../constants'
import { doApiRequest } from '../../utils'
import { Loading } from '../common'

type MembershipRequest = {
  club: string
  club_name: string
}

const MembershipRequestsTab = (): ReactElement => {
  const [requests, setRequests] = useState<MembershipRequest[] | null>(null)

  useEffect(() => {
    doApiRequest('/requests/?format=json')
      .then((resp) => resp.json())
      .then(setRequests)
  }, [])

  if (requests === null) {
    return <Loading />
  }

  return (
    <div>
      <table className="table is-fullwidth">
        <thead>
          <tr>
            <th>Club</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.club}>
              <td>
                <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(req.club)}>
                  <a>{req.club_name}</a>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default MembershipRequestsTab
