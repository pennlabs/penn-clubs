import s from 'styled-components'
import Link from 'next/link'

import ClubTabTable from './ClubTabTable'
import ClubTabCards from './ClubTabCards'
import { EmptyState, Center, Text } from '../common'
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
}) => {
  const isMemberOfAnyClubs = userInfo && userInfo.membership_set && userInfo.membership_set.length

  return isMemberOfAnyClubs ? (
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
  ) : (
    <>
      <EmptyState name="button" />
      <Center>
        <Text isGray>
          No memberships yet! Browse clubs{' '}
          <Link href="/">here.</Link>
        </Text>
      </Center>
    </>
  )
}
