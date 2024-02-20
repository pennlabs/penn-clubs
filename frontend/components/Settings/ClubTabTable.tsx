import Link from 'next/link'
import { ReactElement } from 'react'
import { Tooltip } from 'react-tooltip'
import styled from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { CLUB_EDIT_ROUTE, CLUB_ROUTE } from '../../constants/routes'
import { BODY_FONT } from '../../constants/styles'
import { Club, MembershipRank } from '../../types'
import { getRoleDisplay } from '../../utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon } from '../common'
import { UserMembership } from './ClubTab'
import Toggle from './Toggle'

const Table = styled.table`
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

export const ColumnTooltip = ({ tip }: { tip: string }): ReactElement => (
  <>
    <Icon
      data-tip={tip}
      data-effect="solid"
      data-multiline={true}
      name="info"
      alt="?"
      style={{ paddingLeft: 4 }}
    />
    <Tooltip />
  </>
)

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
        <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
        <th>Position</th>
        <th>
          Permissions
          <ColumnTooltip
            tip={`Shows your level of access to club management tools. Can be one of the following: ${Object.entries(
              MEMBERSHIP_ROLE_NAMES,
            )
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map((role) => role[1])
              .join(', ')}.`}
          />
        </th>
        <th>
          Active
          <ColumnTooltip
            tip={`Toggle whether you’re currently an active member of this ${OBJECT_NAME_SINGULAR}.`}
          />
        </th>
        <th>
          Public
          <ColumnTooltip
            tip={`Toggle whether you want to be listed on the ${OBJECT_NAME_SINGULAR} page.`}
          />
        </th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {memberships.map(({ club, active, public: isPublic, role, title }) => (
        <tr key={club.code}>
          <td>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
              {club.name}
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
              <Link
                legacyBehavior
                href={CLUB_EDIT_ROUTE()}
                as={CLUB_EDIT_ROUTE(club.code)}
              >
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
