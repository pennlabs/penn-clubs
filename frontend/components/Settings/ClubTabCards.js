import s from 'styled-components'
import Toggle from './Toggle'
import { Icon } from '../common'
import Link from 'next/link'
import { BORDER_RADIUS } from '../../constants/measurements'

const Card = s.div`
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 2px 19px 0 rgba(165, 165, 165, 0.5);
  margin: 2.5%;
  margin-bottom: 10%;
  padding: 5%;
  padding-top: 3%;
`
  club,
  toggleActive,
  togglePublic,
  leaveClub
}) => {
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
        <Link
          href="/club/[club]"
          as={`/club/${code}`}
        >
          <a>{name}</a>
        </Link>
        {canManage ? (
          <Link
            href="/club/[club]/edit"
            as={`/club/${code}/edit`}
          >
            <a className="button is-small">
              <Icon name="edit" />
              Manage
              </a>
          </Link>
        ) : (
            <button
              className="button is-small"
              onClick={() => leaveClub(club)}
            >
              <Icon name="log-out" />
              Leave
            </button>
          )}
      </span>
      <span>
        <Icon name="award" />
        Position:
        {title}
      </span>
      <span>
        <Icon name="key" />
        Permission:
        {role}
      </span>
      <hr />
      <span>
        <Icon name="activity" />
        Active:
        <Toggle
          club={club}
          active={active}
          toggle={toggleActive}
        />
      </span>
      <span>
        <Icon name="unlock" />
        Public:
        <Toggle
          club={club}
          active={isPublic}
          toggle={togglePublic}
        />
    </Card>
  )
}

export default ({ className, userInfo, togglePublic, toggleActive, leaveClub }) => {
  const isMemberOfAnyClubs = !(
    userInfo &&
    userInfo.membership_set &&
    userInfo.membership_set.length
  )

  return (
    <div className={className}>
      {isMemberOfAnyClubs ? (
        <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
          You're not a member of any clubs yet! Browse clubs <Link href="/">here.</Link>
        </p>
      ) : (
          userInfo.membership_set.map(club =>
            <ClubCard
              key={club.code}
              club={club}
              togglePublic={togglePublic}
              toggleActive={toggleActive}
              leaveClub={leaveClub}
            />
          )
        )}
    </div>
  )
}
