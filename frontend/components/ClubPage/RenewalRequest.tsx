import Link from 'next/link'
import { ReactElement } from 'react'

import { CLUB_RENEW_ROUTE } from '../../constants/routes'
import { Club, MembershipRank } from '../../types'
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
        <Icon name="alert-circle" style={iconStyles} />
        <b>{club.name}</b> needs to be re-registered for the 2020-2021 academic
        year.
      </AlertText>
      <AlertDesc>
        {club.is_member !== false && club.is_member <= MembershipRank.Member ? (
          <>
            <p className="mb-2">
              You are an officer of this club, so you can start the renewal
              process by clicking the button below.
            </p>
            <Link href={CLUB_RENEW_ROUTE()} as={CLUB_RENEW_ROUTE(club.code)}>
              <a className="button is-success">Renew Now</a>
            </Link>
          </>
        ) : (
          <>
            If you are an officer for this club and require access, please send
            an email with your PennKey and club name to <Contact />.
          </>
        )}
      </AlertDesc>
    </>
  )
}

export default RenewalRequest
