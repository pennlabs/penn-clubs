import { ReactElement, useState } from 'react'

import { Club } from '../../types'
import { apiCheckPermission, doApiRequest, formatResponse } from '../../utils'
import { Text } from '../common'
import Toggle from '../Settings/Toggle'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  notify?: (message: ReactElement | string) => void
  onUpdate?: () => void
}

export default function EnableSubscription({
  club,
  notify = () => undefined,
  onUpdate = () => undefined,
}: Props): ReactElement {
  const [active, enable] = useState(club.enables_subscription)
  const changeEnableSubscription = () => {
    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'PATCH',
      body: {
        enables_subscription: !club.enables_subscription,
      },
    }).then((resp) => {
      if (resp.ok) {
        notify('Successfully changed subscription status')
        onUpdate()
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err))
        })
      }
    })
    enable(!active)
  }
  return (
    <BaseCard title="Enable Subscription List">
      <Text>
        This feature allows you to enable or disable the subscription list. When
        disabled, students will not be able to subscribe to your club, and you
        cannot view the subscription list. Existing subscriptions, however, will
        be saved and can be retrieved when the feature is enabled again.
      </Text>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100' }}>
        <span>Enable Subscription List</span>
        <div style={{ marginLeft: 'auto' }}>
          <Toggle
            club={club}
            active={active}
            toggle={changeEnableSubscription}
          />
        </div>
      </div>
    </BaseCard>
  )
}
