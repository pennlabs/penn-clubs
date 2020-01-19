import Toggle from './Toggle'
import { Icon } from '../common'
import Link from 'next/link'

const ClubTabCard = ({
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
  return (
    <>
      <span>
        <Link
          href="/club/[club]"
          as={`/club/${code}`}
        >
          <a>{name}</a>
        </Link>
        {role === 'Admin' ? (
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
      </span>
    </>
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
