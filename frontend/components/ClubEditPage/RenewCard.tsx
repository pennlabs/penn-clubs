import Link from 'next/link'
import { ReactElement } from 'react'

import { CLUB_RENEW_ROUTE, FAIR_INFO } from '../../constants'
import { Club } from '../../types'
import { useSetting } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import BaseCard from './BaseCard'

type RenewCardProps = {
  club: Club
}

export default function RenewCard({ club }: RenewCardProps): ReactElement {
  const fairName = useSetting('FAIR_NAME')
  const fairInProgress = useSetting('PRE_FAIR') || useSetting('FAIR_OPEN')

  let fairInfo
  if (fairName == null) {
    fairInfo = { name: 'Unknown Fair' }
  } else {
    fairInfo = FAIR_INFO[fairName as string]
  }

  const year = new Date().getFullYear()

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
          {fairInProgress && (
            <div>
              {club.fair ? (
                <span className="has-text-success">
                  <b>
                    This {OBJECT_NAME_SINGULAR} has indicated interest in the{' '}
                    {fairInfo.name}.
                  </b>{' '}
                  Priority for the fair will be given to affiliated{' '}
                  {OBJECT_NAME_PLURAL}, but we will make every attempt to
                  accomodate all {OBJECT_NAME_PLURAL}.
                </span>
              ) : (
                <span className="has-text-danger">
                  <b>
                    This {OBJECT_NAME_SINGULAR} has not indicated interested in
                    the {fairInfo.name}.
                  </b>{' '}
                  If this is a mistake, you can fill out the{' '}
                  <Link
                    href={CLUB_RENEW_ROUTE()}
                    as={CLUB_RENEW_ROUTE(club.code)}
                  >
                    <a>renewal form</a>
                  </Link>{' '}
                  again to change your status.
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          You need to renew your club for the {year}-{year + 1} school year.
          Click on the button below to do so.
          <div className="mt-3">
            <Link href={CLUB_RENEW_ROUTE()} as={CLUB_RENEW_ROUTE(club.code)}>
              <a className="button is-primary">
                Renew {OBJECT_NAME_TITLE_SINGULAR}
              </a>
            </Link>
          </div>
        </>
      )}
    </BaseCard>
  )
}
