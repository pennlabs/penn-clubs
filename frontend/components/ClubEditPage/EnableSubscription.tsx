import { ReactElement, useState } from 'react'
import { Club } from '../../types'
import { Text } from '../common'
import BaseCard from './BaseCard'
import Toggle from "../Settings/Toggle"
import { apiCheckPermission, doApiRequest, formatResponse } from '../../utils'

type Props = {
    club: Club
    notify?: (message: ReactElement | string) => void
  }

export default function EnableSubscription ({
    club,
     notify = ()=>undefined }: Props) : ReactElement {
    const [active, enable] = useState(club.enables_subscription);
    const changeEnableSubscription = ()=> {
        doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body : {
                enables_subscription : !club.enables_subscription
            }
          }).then((resp) => {
            if (resp.ok) {
              notify('Successfully changed subscription status')
            } else {
              resp.json().then((err) => {
                notify(formatResponse(err))
              })
            }
          })
        enable (!active);
    } 
    return (
        <BaseCard title= "Enable Subscription List">
            <Text>
                This allows you to choose wether you want a subscription list for your club or not
            </Text>
            <div style ={{display: "flex", flexDirection: "row", width: "100"}}>
                <span>Enable Subscription List</span>
                <div style={{marginLeft:"auto"}}>
                <Toggle  club={club} active={active} toggle ={changeEnableSubscription} />
                </div>
            </div>

        </BaseCard>
    )
}