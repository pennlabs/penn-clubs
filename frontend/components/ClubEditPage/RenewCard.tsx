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
          <div className="mb-3">
            <b>{club.name}</b> has completed the club renewal process for the{' '}
            {year}-{year + 1} school year.
            {club.approved ? (
              <>
                {' '}
                The club has <b>received approval</b> from the Office of Student
                Affairs.
              </>
            ) : (
              <>
                {' '}
                The club is currently <b>pending approval</b> from the Office of
                Student Affairs.
              </>
            )}
          </div>
          <div>
            {club.fair ? (
              <span className="has-text-success">
                <b>This club has indicated interest in the SAC fair.</b>{' '}
                Priority for the fair will be given to SAC affiliated clubs, but
                we will make every attempt to accomodate all clubs.
              </span>
            ) : (
              <span className="has-text-danger">
                <b>This club has not indicated interested in the SAC fair.</b>{' '}
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
