import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUB_RENEW_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { apiCheckPermission, doApiRequest, isSummer } from '../../utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_SINGULAR,
  SITE_ID,
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

const RenewalRequest = ({ club }: RenewalRequestProps): ReactElement<any> => {
  const [reapprovalOpen, setReapprovalOpen] = useState<boolean | null>(null)

  // Retrieve registration queue settings once on mount
  useEffect(() => {
    doApiRequest('/settings/queue/?format=json')
      .then((resp) => resp.json())
      .then((data) => setReapprovalOpen(data.reapproval_queue_open))
      .catch(() => setReapprovalOpen(null))
  }, [])

  const canRenew =
    apiCheckPermission(`clubs.manage_club:${club.code}`) &&
    !isSummer() &&
    reapprovalOpen === true
  const textMapping = {
    clubs: {
      TITLE: (
        <>
          {reapprovalOpen === true ? (
            <>
              <b>{club.name}</b> needs to be re-registered for the current
              academic year.
            </>
          ) : (
            <b>The club renewal process has not started yet.</b>
          )}
        </>
      ),
      PROCESS_ACTION: 'start the renewal process',
      BUTTON_TEXT: 'Renew Now',
    },
    fyh: {
      TITLE: (
        <>
          <b>{club.name}</b> still needs to complete the registration process.
        </>
      ),
      PROCESS_ACTION: 'continue the registration process',
      BUTTON_TEXT: 'Continue Registration',
    },
  }

  const text = textMapping[SITE_ID] ?? textMapping.clubs

  return (
    <>
      <AlertText>
        <Icon name="alert-circle" style={iconStyles} />
        {text.TITLE}
      </AlertText>
      <AlertDesc>
        {canRenew ? (
          <>
            {club.is_member !== false ? (
              <p className="mb-2">
                You are an {MEMBERSHIP_ROLE_NAMES[club.is_member].toLowerCase()}{' '}
                of this {OBJECT_NAME_SINGULAR}, so you can {text.PROCESS_ACTION}{' '}
                by clicking the button below. Your {OBJECT_NAME_SINGULAR} will
                not be queued for approval until this process is complete.
              </p>
            ) : (
              <p className="mb-2">
                Although you are not a part of this {OBJECT_NAME_SINGULAR}, you
                have permissions to {text.PROCESS_ACTION} for this club. You can
                do so using the button below.
              </p>
            )}
            <Link
              legacyBehavior
              href={CLUB_RENEW_ROUTE()}
              as={CLUB_RENEW_ROUTE(club.code)}
            >
              <a className="button is-danger is-light">{text.BUTTON_TEXT}</a>
            </Link>
          </>
        ) : (
          <>
            {/* If you are an{' '}
            {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()} for
            this {OBJECT_NAME_SINGULAR} and require access, please send an email
            with your PennKey and {OBJECT_NAME_SINGULAR} name to <Contact />. */}
            You will be able to submit your renewal for the current school year
            once the reapproval queue opens. Please contact <Contact /> with any
            questions.
          </>
        )}
      </AlertDesc>
    </>
  )
}

export default RenewalRequest
