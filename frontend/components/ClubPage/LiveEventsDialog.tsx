import Link from 'next/link'
import { ReactElement } from 'react'
import s from 'styled-components'

import { LIVE_EVENTS, M2, M4 } from '../../constants'

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

const WhiteButton = s.div`
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
`

interface LiveEventsDialogProps {
  liveEventCount: number
}

const LiveEventsDialog = ({
  liveEventCount,
}: LiveEventsDialogProps): ReactElement => (
  <LiveBanner>
    <Link href={LIVE_EVENTS} as={LIVE_EVENTS}>
      <WhiteButton>See Live Events</WhiteButton>
    </Link>
    <LiveTitle>Virtual Activity Fair</LiveTitle>
    <LiveSub>
      {liveEventCount}{' '}
      {liveEventCount === 1
        ? 'club is holding an event'
        : 'clubs are holding events'}{' '}
      right now.
    </LiveSub>
  </LiveBanner>
)

export default LiveEventsDialog
