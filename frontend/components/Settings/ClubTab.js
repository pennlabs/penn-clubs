import s from 'styled-components'
import ClubTabTable from './ClubTabTable'
import ClubTabCards from './ClubTabCards'
import { mediaMinWidth, mediaMaxWidth, SM } from '../../constants/measurements'

const ClubTable = s(ClubTabTable)`
  ${mediaMaxWidth(SM)} {
    display: none !important;
  }
`

const ClubCards = s(ClubTabCards)`
  ${mediaMinWidth(SM)} {
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
