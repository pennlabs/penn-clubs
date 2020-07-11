import ClubTabCard from './ClubTabCard'

export default ({
  className,
  userInfo,
  togglePublic,
  toggleActive,
  leaveClub,
}) => (
  <div className={className}>
    {userInfo.membership_set.map((club) => (
      <ClubTabCard
        key={club.code}
        club={club}
        togglePublic={togglePublic}
        toggleActive={toggleActive}
        leaveClub={leaveClub}
      />
    ))}
  </div>
)
