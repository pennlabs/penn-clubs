import Link from 'next/link'
import { ReactElement } from 'react'
import ReactTooltip from 'react-tooltip'
import s from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { CLUB_EDIT_ROUTE, CLUB_ROUTE } from '../../constants/routes'
import { BODY_FONT } from '../../constants/styles'
import { Club, MembershipRank } from '../../types'
import { getRoleDisplay } from '../../utils'
import { MEMBERSHIP_ROLE_NAMES } from '../../utils/branding'
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

const ClubTabTable = ({
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
        <th>Position</th>
        <th>
          Permissions
          <Icon
            data-tip={`Shows your level of access to club management tools. Can be a ${
              MEMBERSHIP_ROLE_NAMES[MembershipRank.Member]
            }, ${MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]}, or ${
              MEMBERSHIP_ROLE_NAMES[MembershipRank.Owner]
            }.`}
            data-effect="solid"
            data-multiline="true"
            name="info"
            alt="?"
            style={{ paddingLeft: 4 }}
          />
          <ReactTooltip />
        </th>
        <th>
          Active
          <Icon
            data-tip="Toggle whether you’re currently an active member of the club"
            data-effect="solid"
            data-multiline="true"
            name="info"
            alt="?"
            style={{ paddingLeft: 4 }}
          />
          <ReactTooltip />
        </th>
        <th>
          Public
          <Icon
            data-tip="Toggle if you would like to be listed as a member on the club’s page"
            data-effect="solid"
            name="info"
            alt="?"
            style={{ paddingLeft: 4 }}
          />
          <ReactTooltip />
        </th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {memberships.map(({ club, active, public: isPublic, role, title }) => (
        <tr key={club.code}>
          <td>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
              <a>{club.name}</a>
            </Link>
          </td>
          <td>{title}</td>
          <td>{getRoleDisplay(role)}</td>
          <td>
            <Toggle
              club={club}
              active={active}
              toggle={(club) => toggleActive(club)}
            />
          </td>
          <td>
            <Toggle
              club={club}
              active={isPublic}
              toggle={(club) => togglePublic(club)}
            />
          </td>
          <td>
            {role <= MembershipRank.Officer ? (
              <Link href={CLUB_EDIT_ROUTE()} as={CLUB_EDIT_ROUTE(club.code)}>
                <a className="button is-small">Manage</a>
              </Link>
            ) : (
              <button
                className="button is-small"
                onClick={() => leaveClub(club)}
              >
                Leave
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
)

export default ClubTabTable
