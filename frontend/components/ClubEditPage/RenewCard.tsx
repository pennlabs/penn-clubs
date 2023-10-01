import Link from 'next/link'
import { ReactElement } from 'react'

import { CLUB_RENEW_ROUTE } from '../../constants'
import { Club } from '../../types'
import { getCurrentSchoolYear } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import BaseCard from './BaseCard'

type RenewCardProps = {
  club: Club
}

export default function RenewCard({ club }: RenewCardProps): ReactElement {
  const year = getCurrentSchoolYear()

  return (
    <BaseCard title={`Renew ${OBJECT_NAME_TITLE_SINGULAR} Approval`}>
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
            <Link
              href={CLUB_RENEW_ROUTE()}
              as={CLUB_RENEW_ROUTE(club.code)}
              className="button is-primary"
            >
              Renew{OBJECT_NAME_TITLE_SINGULAR}
            </Link>
          </div>
        </>
      )}
    </BaseCard>
  )
}
