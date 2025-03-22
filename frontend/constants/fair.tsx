import { ReactElement } from 'react'

type FairInfoType = {
  [key: string]: {
    name: string
    organization: string
    contact: string
    time: string
    additionalInformation?: () => ReactElement<any> | null
  }
}
