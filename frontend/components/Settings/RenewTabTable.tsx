import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { CLUB_RENEW_ROUTE, CLUB_ROUTE } from '../../constants/routes'
import { BODY_FONT } from '../../constants/styles'
import { MembershipRank, UserMembership } from '../../types'
import { MEMBERSHIP_ROLE_NAMES } from '../../utils/branding'
import { Icon } from '../common'

const Table = styled.table`
  font-family: ${BODY_FONT};
  font-size: 16px;
  overflow: scroll;
  color: ${DARK_GRAY} !important;
`

type ClubTabTableProps = {
  className?: string
  memberships: UserMembership[]
}

const RenewTabTable = ({
  className,
  memberships,
}: ClubTabTableProps): ReactElement<any> => (
  <Table className={`table is-fullwidth ${className}`}>
    <thead>
      <tr>
        <th>Club</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {memberships.map(({ club, role }) => (
        <tr key={club.code}>
          <td>
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
              {club.name}
            </Link>
          </td>
          <td>
            {!club.active ? (
              role <= MembershipRank.Officer ? (
                <Link
                  legacyBehavior
                  href={CLUB_RENEW_ROUTE()}
                  as={CLUB_RENEW_ROUTE(club.code)}
                >
                  <a className="button is-small">Renew</a>
                </Link>
              ) : (
                <span className="has-text-info">
                  <Icon name="alert-triangle" /> Not{' '}
                  {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]}
                </span>
              )
            ) : club.approved ? (
              <span className="has-text-success">
                <Icon name="check" /> Renewed
              </span>
            ) : club.approved === false ? (
              <span className="has-text-danger">
                <Icon name="x" /> Not Approved
              </span>
            ) : (
              <span className="has-text-info">
                <Icon name="clock" /> Pending Approval
              </span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
)

export default RenewTabTable
