import Link from 'next/link'
import { ReactElement } from 'react'

import { useRegistrationQueueSettings } from '~/hooks/useRegistrationQueueSettings'

import { CLUB_RENEW_ROUTE } from '../../constants'
import { Club } from '../../types'
import { getCurrentSchoolYear } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Contact } from '../common/Contact'
import BaseCard from './BaseCard'

export const ClubRenewalProcessWarningBanner = (): ReactElement<any> => (
  <div className="notification is-warning mb-3">
    The {OBJECT_NAME_SINGULAR} renewal process has not started yet. You will be
    able to submit your renewal for the current school year once the reapproval
    queue opens. Please contact <Contact point="osa" /> with any questions.
  </div>
)

type RenewCardProps = {
  club: Club
}

export default function RenewCard({ club }: RenewCardProps): ReactElement<any> {
  const year = getCurrentSchoolYear()
  const { settings: queueSettings } = useRegistrationQueueSettings()

  return (
    <BaseCard title={`Renew ${OBJECT_NAME_TITLE_SINGULAR} Approval`}>
      {/* Banner if queue is not open */}
      {queueSettings?.reapproval_queue_open !== true && (
        <ClubRenewalProcessWarningBanner />
      )}
      {club.active ? (
        <>
          <div className="mb-3">
            <b>{club.name}</b> has completed the {OBJECT_NAME_SINGULAR} renewal
            process for the {year}-{year + 1} school year.
            {club.approved ? (
              <>
                {' '}
                The {OBJECT_NAME_SINGULAR} has <b>received approval</b> from the{' '}
                {APPROVAL_AUTHORITY}.
              </>
            ) : (
              <>
                {' '}
                The {OBJECT_NAME_SINGULAR} is currently <b>pending approval</b>{' '}
                from the {APPROVAL_AUTHORITY}.
              </>
            )}
          </div>
        </>
      ) : (
        <>
          You need to renew your club for the {year}-{year + 1} school year.
          Click on the button below to do so.
          <div className="mt-3">
            {queueSettings?.reapproval_queue_open !== true ? (
              <button className="button is-primary" disabled>
                Renew {OBJECT_NAME_TITLE_SINGULAR}
              </button>
            ) : (
              <Link
                legacyBehavior
                href={CLUB_RENEW_ROUTE()}
                as={CLUB_RENEW_ROUTE(club.code)}
              >
                <a className="button is-primary">
                  Renew {OBJECT_NAME_TITLE_SINGULAR}
                </a>
              </Link>
            )}
          </div>
        </>
      )}
    </BaseCard>
  )
}
