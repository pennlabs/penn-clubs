import Link from 'next/link'
import { ReactElement } from 'react'

import { CLUB_RENEW_ROUTE } from '../../constants/routes'
import { Club, MembershipRank } from '../../types'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
} from '../../utils/branding'
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
        {club.is_member !== false &&
        club.is_member <= MembershipRank.Officer ? (
          <>
            <p className="mb-2">
              You are an {MEMBERSHIP_ROLE_NAMES[club.is_member].toLowerCase()}{' '}
              of this {OBJECT_NAME_SINGULAR}, so you can start the renewal
              process by clicking the button below.
            </p>
            <Link href={CLUB_RENEW_ROUTE()} as={CLUB_RENEW_ROUTE(club.code)}>
              <a className="button is-danger is-light">Renew Now</a>
            </Link>
          </>
        ) : (
          <>
            If you are an{' '}
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()} for
            this {OBJECT_NAME_SINGULAR} and require access, please send an email
            with your PennKey and {OBJECT_NAME_SINGULAR} name to <Contact />.
          </>
        )}
      </AlertDesc>
    </>
  )
}

export default RenewalRequest
