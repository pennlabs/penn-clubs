import { ReactElement } from 'react'

import { Club } from '../../types'
import { getSizeDisplay } from '../../utils'
import { Icon, AlertText, AlertDesc } from '../common'

const iconStyles = {
  opacity: 1,
  size:48,
  marginRight: '5px',
  marginBottom: '3px',
}

const infoStyles = {
  marginBottom: '5px',
}

type RenewalRequestProps = {
  club: Club
}

const RenewalRequest = (props: RenewalRequestProps): ReactElement => {

  return (
    <>
        <AlertText>
          <Icon name={'alert-circle'} style={iconStyles} />
          This club needs to be re-registered for the 2020-2021 academic year.
        </AlertText>
        <AlertDesc>
          If you are an officer for this club and require access, please send an email with your PennKey and club name to contact@pennclubs.com.
        </AlertDesc>
    </>
    
  )
}

export default RenewalRequest
