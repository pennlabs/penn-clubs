import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import {
  FAIR_INFO_ROUTE,
  FAIR_OFFICER_GUIDE_ROUTE,
  LIVE_EVENTS,
  M2,
  M4,
} from '../../constants'
import { ClubEventType, MembershipRank } from '../../types'
import { doApiRequest, useSetting } from '../../utils'
import { FAIR_NAME, MEMBERSHIP_ROLE_NAMES } from '../../utils/branding'

export const LiveBanner = styled.div`
  padding: 20px;
  border-radius: 5px;
  background-image: radial-gradient(
      circle at 15% 0,
      rgba(216, 127, 200, 0.5),
      rgba(73, 84, 244, 0.4) 36%
    ),
    radial-gradient(circle at 55% 130%, #ff8a97, rgba(73, 84, 244, 0.23) 62%),
    radial-gradient(
      circle at 93% 24%,
      rgba(239, 76, 95, 0.76),
      rgba(73, 84, 244, 0.27) 41%
    ),
    linear-gradient(
      171deg,
      #626bf3 -13%,
      #b24f95 104%,
      rgba(239, 76, 95, 0.96) 104%
    ),
    linear-gradient(to bottom, #4954f4, #4954f4);
  margin-bottom: 10px;
`

export const LiveTitle = styled.div`
  font-size: ${M4};
  font-weight: bold;
  color: white;
`

export const LiveSub = styled.div`
  margin-top: -3px;
  margin-bottom: 3px;
  font-size: ${M2};
  color: white;
`

const WhiteButton = styled.a`
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
  isPreFair: boolean
  isFair: boolean
  isVirtual: boolean
}

const LiveEventsDialog = ({
  isPreFair,
  isFair,
  isVirtual,
}: LiveEventsDialogProps): ReactElement<any> | null => {
  const fairName = useSetting('FAIR_NAME')
  const fairContactEmail = useSetting('FAIR_CONTACT')
  const [liveEventCount, setLiveEventCount] = useState<number>(0)

  useEffect(() => {
    if (fairName != null) {
      const now = new Date().toISOString()
      doApiRequest(
        `/events/?format=json&type=${ClubEventType.FAIR}&start_time__lte=${now}&end_time__gte=${now}`,
      )
        .then((resp) => resp.json())
        .then((data) => setLiveEventCount(data.length))
    }
  }, [])

  if (fairName == null) {
    return null
  }

  return (
    <LiveBanner>
      {isPreFair && isVirtual && (
        <Link
          legacyBehavior
          href={FAIR_OFFICER_GUIDE_ROUTE}
          as={FAIR_OFFICER_GUIDE_ROUTE}
          passHref
        >
          <WhiteButton>
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]} Setup
          </WhiteButton>
        </Link>
      )}
      {isFair && isVirtual && (
        <Link href={LIVE_EVENTS} as={LIVE_EVENTS} passHref legacyBehavior>
          <WhiteButton>See Live Events</WhiteButton>
        </Link>
      )}
      <Link href={FAIR_INFO_ROUTE} as={FAIR_INFO_ROUTE} passHref legacyBehavior>
        <WhiteButton>Fair Information</WhiteButton>
      </Link>
      <LiveTitle>{fairName}</LiveTitle>
      <LiveSub>
        {liveEventCount === 0 || !isVirtual ? (
          `Get ready for the ${isVirtual ? 'virtual ' : ''}${FAIR_NAME} fair! For any issues with registering, email ${fairContactEmail}.`
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

const LiveCustomDialog = ({ text }): ReactElement<any> | null => {
  return (
    <LiveBanner>
      <LiveTitle>Notice</LiveTitle>
      <LiveSub>{text}</LiveSub>
    </LiveBanner>
  )
}

export { LiveCustomDialog, LiveEventsDialog }
