import Link from 'next/link'
import s from 'styled-components'

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
import { Icon } from '../common'
import Toggle from './Toggle'

const Card = s.div`
  color: ${CLUBS_NAVY}
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 2px 19px 0 ${BLACK_ALPHA(0.25)};
  margin: 2.5%;
  margin-bottom: 10%;
  padding: 5%;
  padding-top: 3%;
`

const CardRow = s.span`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-bottom: 6px;
`

const CardDivider = s.hr`
  margin: 0.4rem;
`

const CardTitle = s.p`
  font-size: 1.25rem;
  font-weight: bold;
  margin-right: auto;
  width: 70%;
`

const ManageButton = s.a`
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

const LeaveButton = s.a`
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

const ButtonIcon = s(Icon)`
  margin-left: 0;
  margin-right: 5px;
  margin-bottom: 0.4rem;
`

const RowIcon = s(Icon)`
  margin-right: 5px;
`

const RightWrapper = s.div`
  color: ${LIGHT_GRAY}
  margin-left: auto;
  text-align: right;
  justify-content: flex-start;
`

export default ({ club, toggleActive, togglePublic, leaveClub }) => {
  const {
    code,
    name,
    role_display: role,
    title,
    active,
    public: isPublic,
  } = club
  const canManage = role === 'Owner' || role === 'Officer'

  return (
    <Card className="card">
      <CardRow>
        <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
          <CardTitle>{name}</CardTitle>
        </Link>
        {canManage ? (
          <Link href={CLUB_EDIT_ROUTE()} as={CLUB_EDIT_ROUTE(code)}>
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
        <RightWrapper>{role}</RightWrapper>
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
