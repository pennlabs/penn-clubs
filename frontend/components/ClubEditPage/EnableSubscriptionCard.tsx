import { ReactElement, useState } from 'react'

import { Club } from '../../types'
import { doApiRequest, formatResponse } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Text } from '../common'
import Toggle from '../Settings/Toggle'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  notify?: (message: ReactElement<any> | string, type?: string) => void
  onUpdate?: () => void
}

export default function EnableSubscriptionCard({
  club,
  notify = () => undefined,
  onUpdate = () => undefined,
}: Props): ReactElement<any> {
  const [active, enable] = useState(club.enables_subscription)
  const changeEnableSubscription = () => {
    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'PATCH',
      body: {
        enables_subscription: !club.enables_subscription,
      },
    }).then((resp) => {
      if (resp.ok) {
        notify(
          `Successfully ${
            !club.enables_subscription ? 'enabled' : 'disabled'
          } subscriptions feature for ${club.name}.`,
          'success',
        )
        onUpdate()
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
    enable(!active)
  }
  return (
    <BaseCard title="Enable Subscription List">
      <Text>
        This feature allows you to enable or disable the subscription list. When
        disabled, students will not be able to subscribe to your{' '}
        {OBJECT_NAME_SINGULAR}, and you cannot view the subscription list.
        Existing subscriptions, however, will be saved and can be retrieved when
        the feature is enabled again.
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
