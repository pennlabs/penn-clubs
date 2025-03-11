import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import {
  BLACK_ALPHA,
  CLUBS_BLUE,
  CLUBS_DEEP_BLUE,
  CLUBS_NAVY,
  CLUBS_RED,
  CLUBS_RED_DARK,
  LIGHT_GRAY,
  WHITE,
  WHITE_ALPHA,
} from '../../constants/colors'
import { BORDER_RADIUS } from '../../constants/measurements'
import { CLUB_EDIT_ROUTE, CLUB_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { getRoleDisplay } from '../../utils'
import { Icon } from '../common'
import { UserMembership } from './ClubTab'
import Toggle from './Toggle'

const Card = styled.div`
  color: ${CLUBS_NAVY}
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 2px 19px 0 ${BLACK_ALPHA(0.25)};
  margin: 2.5%;
  margin-bottom: 10%;
  padding: 5%;
  padding-top: 3%;
`

const CardRow = styled.span`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 6px;
`

const CardDivider = styled.hr`
  margin: 0.4rem;
`

const CardTitle = styled.p`
  font-size: 1.25rem;
  font-weight: bold;
  margin-right: auto;
  width: 70%;
`

const ManageButton = styled.a`
  border: 0;
  border-radius: ${BORDER_RADIUS};
  background-color: ${CLUBS_BLUE};
  color: ${WHITE_ALPHA(0.8)};
  justify-content: flex-start;

  &:hover,
  &:focus,
  &:active {
    background-color: ${CLUBS_DEEP_BLUE};
    color: ${WHITE} !important;
  }
`

const LeaveButton = styled.a`
  border: 0;
  border-radius: ${BORDER_RADIUS};
  background-color: ${CLUBS_RED};
  color: ${WHITE_ALPHA(0.8)};
  justify-content: flex-start;

  &:hover,
  &:focus,
  &:active {
    background-color: ${CLUBS_RED_DARK};
    color: ${WHITE} !important;
  }
`

const ButtonIcon = styled(Icon)`
  margin-left: 0;
  margin-right: 5px;
  margin-bottom: 0.4rem;
`

const RowIcon = styled(Icon)`
  margin-right: 5px;
`

const RightWrapper = styled.div`
  color: ${LIGHT_GRAY}
  margin-left: auto;
  text-align: right;
  justify-content: flex-start;
`

type ClubTabCardProps = {
  membership: UserMembership
  toggleActive: (club: Club) => void
  togglePublic: (club: Club) => void
  leaveClub: (club: Club) => void
}

const ClubTabCard = ({
  membership,
  toggleActive,
  togglePublic,
  leaveClub,
}: ClubTabCardProps): ReactElement<any> => {
  const { club, role, title, active, public: isPublic } = membership
  const { code, name } = club
  const roleDisplay = getRoleDisplay(role)
  const canManage = role <= 10

  return (
    <Card className="card">
      <CardRow>
        <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)} legacyBehavior>
          <CardTitle>{name}</CardTitle>
        </Link>
        {canManage ? (
          <Link
            legacyBehavior
            href={CLUB_EDIT_ROUTE()}
            as={CLUB_EDIT_ROUTE(code)}
          >
            <ManageButton className="button is-small">
              <ButtonIcon name="edit" size="1rem" />
              Manage
            </ManageButton>
          </Link>
        ) : (
          <LeaveButton
            className="button is-small"
            onClick={() => leaveClub(club)}
          >
            <ButtonIcon name="log-out" size="1rem" />
            Leave
          </LeaveButton>
        )}
      </CardRow>
      <CardRow>
        <RowIcon name="award" />
        Position:
        <RightWrapper>{title}</RightWrapper>
      </CardRow>
      <CardRow>
        <RowIcon name="key" />
        Permission:
        <RightWrapper>{roleDisplay}</RightWrapper>
      </CardRow>
      <CardDivider />
      <CardRow>
        <RowIcon name="activity" />
        Active:
        <RightWrapper>
          <Toggle club={club} active={active} toggle={toggleActive} />
        </RightWrapper>
      </CardRow>
      <CardRow>
        <RowIcon name="unlock" />
        Public:
        <RightWrapper>
          <Toggle club={club} active={isPublic} toggle={togglePublic} />
        </RightWrapper>
      </CardRow>
    </Card>
  )
}

export default ClubTabCard
