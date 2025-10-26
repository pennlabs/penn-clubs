import { ReactElement } from 'react'

import { Club } from '../../types'
import { UserMembership } from './ClubTab'
import ClubTabCard from './ClubTabCard'

type ClubTabCardProps = {
  className?: string
  memberships: UserMembership[]
  togglePublic: (club: Club) => void
  toggleActive: (club: Club) => void
  leaveClub: (club: Club) => void
}

const ClubTabCards = ({
  className,
  memberships,
  togglePublic,
  toggleActive,
  leaveClub,
}: ClubTabCardProps): ReactElement<any> => (
  <div className={className}>
    {memberships.map((mship) => (
      <ClubTabCard
        key={mship.club.code}
        membership={mship}
        togglePublic={togglePublic}
        toggleActive={toggleActive}
        leaveClub={leaveClub}
      />
    ))}
  </div>
)

export default ClubTabCards
