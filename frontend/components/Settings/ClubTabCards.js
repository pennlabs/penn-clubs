import Link from 'next/link'
import ClubTabCard from './ClubTabCard'

export default ({
  className,
  userInfo,
  togglePublic,
  toggleActive,
  leaveClub,
}) => {
  const isMemberOfAnyClubs = !(
    userInfo &&
    userInfo.membership_set &&
    userInfo.membership_set.length
  )

  return (
    <div className={className}>
      {isMemberOfAnyClubs ? (
        <p
          className="has-text-light-grey"
          style={{ paddingTop: 200, textAlign: 'center' }}
        >
          You're not a member of any clubs yet! Browse clubs{' '}
          <Link href="/">here.</Link>
        </p>
      ) : (
        userInfo.membership_set.map(club => (
          <ClubTabCard
            key={club.code}
            club={club}
            togglePublic={togglePublic}
            toggleActive={toggleActive}
            leaveClub={leaveClub}
          />
        ))
      )}
    </div>
  )
}
