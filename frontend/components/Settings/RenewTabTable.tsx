import Link from 'next/link'
import { ReactElement } from 'react'
import ReactTooltip from 'react-tooltip'
import s from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { CLUB_EDIT_ROUTE, CLUB_ROUTE } from '../../constants/routes'
import { BODY_FONT } from '../../constants/styles'
import { Club, MembershipRank } from '../../types'
import { getRoleDisplay } from '../../utils'
import { Icon } from '../common'
import { UserMembership } from './ClubTab'
import Toggle from './Toggle'

const Table = s.table`
  font-family: ${BODY_FONT};
  font-size: 16px;
  overflow: scroll;
  color: ${DARK_GRAY} !important;
`

type ClubTabTableProps = {
  className?: string
  memberships: UserMembership[]
  togglePublic: (club: Club) => void
  toggleActive: (club: Club) => void
  leaveClub: (club: Club) => void
}

export default ({
  className,
  memberships,
  togglePublic,
  toggleActive,
  leaveClub,
}: ClubTabTableProps): ReactElement => (
  <Table className={`table is-fullwidth ${className}`}>
    <thead>
      <tr>
        <th>Club</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {memberships.map(({ club, active, public: isPublic, role }) => (
        <tr key={club.code}>
          <td>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
              <a>{club.name}</a>
            </Link>
          </td>
          <td>
            {role <= MembershipRank.Officer ? (
              <Link href={CLUB_EDIT_ROUTE()} as={CLUB_EDIT_ROUTE(club.code)}>
                <a className="button is-small">Manage</a>
              </Link>
            ) : (
              <></>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
)
