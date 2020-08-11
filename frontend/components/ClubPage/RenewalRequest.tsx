import { ReactElement } from 'react'

import { Club } from '../../types'
import { AlertDesc, AlertText, Contact, Icon } from '../common'

const iconStyles = {
  opacity: 1,
  size: 48,
  marginRight: '5px',
  marginBottom: '3px',
}

type RenewalRequestProps = {
  club: Club
}

const RenewalRequest = ({ club }: RenewalRequestProps): ReactElement => {
  return (
    <>
      <AlertText>
        <Icon name={'alert-circle'} style={iconStyles} />
        <b>{club.name}</b> needs to be re-registered for the 2020-2021 academic
        year.
      </AlertText>
      <AlertDesc>
        If you are an officer for this club and require access, please send an
        email with your PennKey and club name to <Contact />.
      </AlertDesc>
    </>
  )
}

export default RenewalRequest
