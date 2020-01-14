import s from 'styled-components'
import ClubTabTable from './ClubTabTable'
import ClubTabCards from './ClubTabCards'

const ClubTable = s(ClubTabTable)`
  @media (max-width: 768px) {
    display: none !important;
  }
`

const ClubCards = s(ClubTabCards)`
  @media (min-width: 769px) {
    display: none !important;
  }
`

export default ({
  className,
  userInfo,
  togglePublic,
  toggleActive,
  leaveClub,
}) => (
  <>
    <ClubTable
      className={className}
      userInfo={userInfo}
      togglePublic={togglePublic}
      toggleActive={toggleActive}
      leaveClub={leaveClub}
    />
    <ClubCards
      className={className}
      userInfo={userInfo}
      togglePublic={togglePublic}
      toggleActive={toggleActive}
      leaveClub={leaveClub}
    />
  </>
)
