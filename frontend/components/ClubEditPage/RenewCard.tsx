import Link from 'next/link'
import { ReactElement } from 'react'

import { CLUB_RENEW_ROUTE } from '../../constants'
import { Club } from '../../types'
import BaseCard from './BaseCard'

type RenewCardProps = {
  club: Club
}

export default function RenewCard({ club }: RenewCardProps): ReactElement {
  const year = new Date().getFullYear()

  return (
    <BaseCard title="Renew Club Approval">
      {club.active ? (
        <>
          <b>{club.name}</b> has completed the club renewal process for the{' '}
          {year}-{year + 1} school year.
          {club.approved
            ? ' The club has received approval from the Office of Student Affairs.'
            : ' The club is currently pending approval from the Office of Student Affairs.'}
        </>
      ) : (
        <>
          You need to renew your club for the {year}-{year + 1} school year.
          Click on the button below to do so.
          <div className="mt-3">
            <Link href={CLUB_RENEW_ROUTE()} as={CLUB_RENEW_ROUTE(club.code)}>
              <a className="button is-primary">Renew Club</a>
            </Link>
          </div>
        </>
      )}
    </BaseCard>
  )
}
