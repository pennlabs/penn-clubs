import Link from 'next/link'
import { ReactElement } from 'react'
import s from 'styled-components'

import {
  FAIR_INFO,
  FAIR_INFO_ROUTE,
  FAIR_OFFICER_GUIDE_ROUTE,
  LIVE_EVENTS,
  M2,
  M4,
} from '../../constants'
import { MembershipRank } from '../../types'
import { useSetting } from '../../utils'
import { MEMBERSHIP_ROLE_NAMES } from '../../utils/branding'

const LiveBanner = s.div`
  padding: 20px;
  border-radius: 5px;
  background-image: radial-gradient(circle at 15% 0, rgba(216, 127, 200, 0.5), rgba(73, 84, 244, 0.4) 36%), radial-gradient(circle at 55% 130%, #ff8a97, rgba(73, 84, 244, 0.23) 62%), radial-gradient(circle at 93% 24%, rgba(239, 76, 95, 0.76), rgba(73, 84, 244, 0.27) 41%), linear-gradient(171deg, #626bf3 -13%, #b24f95 104%, rgba(239, 76, 95, 0.96) 104%), linear-gradient(to bottom, #4954f4, #4954f4);
  margin-bottom: 10px;
`

const LiveTitle = s.div`
  font-size: ${M4};
  font-weight: bold;
  color: white;
`

const LiveSub = s.div`
  margin-top: -3px;
  margin-bottom: 3px;
  font-size: ${M2};
  color: white;
`

const WhiteButton = s.a`
  padding: 7px;
  width: 140px;
  text-align: center;
  font-size: 14px;
  color: white;
  background-color: rgba(255, 255, 255, 0.43);
  border-radius: 30px;
  float: right;
  cursor: pointer;
  margin-top: 10px;
  margin-left: 15px;
  transition: background-color 0.25s ease;

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.36);
  }
`

interface LiveEventsDialogProps {
  liveEventCount: number
  isPreFair: boolean
  isFair: boolean
}

const LiveEventsDialog = ({
  liveEventCount,
  isPreFair,
  isFair,
}: LiveEventsDialogProps): ReactElement | null => {
  const fairName = useSetting('FAIR_NAME')

  if (fairName == null) {
    return null
  }

  const fairInfo = FAIR_INFO[fairName as string]

  return (
    <LiveBanner>
      {isPreFair && (
        <Link
          href={FAIR_OFFICER_GUIDE_ROUTE}
          as={FAIR_OFFICER_GUIDE_ROUTE}
          passHref
        >
          <WhiteButton>
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]} Setup
          </WhiteButton>
        </Link>
      )}
      {isFair && (
        <Link href={LIVE_EVENTS} as={LIVE_EVENTS} passHref>
          <WhiteButton>See Live Events</WhiteButton>
        </Link>
      )}
      <Link href={FAIR_INFO_ROUTE} as={FAIR_INFO_ROUTE} passHref>
        <WhiteButton>Fair Information</WhiteButton>
      </Link>
      <LiveTitle>{fairInfo.name}</LiveTitle>
      <LiveSub>
        {liveEventCount === 0 ? (
          'Get ready for the virtual activities fair!'
        ) : (
          <>
            {liveEventCount}{' '}
            {liveEventCount === 1
              ? 'club is holding an event'
              : 'clubs are holding events'}{' '}
            right now.
          </>
        )}
      </LiveSub>
    </LiveBanner>
  )
}

export default LiveEventsDialog
