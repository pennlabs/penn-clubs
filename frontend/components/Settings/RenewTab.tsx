import { ReactElement, useEffect, useState } from 'react'

import { UserInfo, UserMembership } from '../../types'
import { doApiRequest } from '../../utils'
import { Center, Contact, EmptyState, Loading, Text } from '../common'
import RenewTabTable from './RenewTabTable'

type ClubTabProps = {
  className?: string
  userInfo: UserInfo
}

export default ({ className }: ClubTabProps): ReactElement => {
  const [memberships, setMemberships] = useState<UserMembership[] | null>(null)

  const reloadMemberships = () => {
    doApiRequest('/memberships/?format=json')
      .then((resp) => resp.json())
      .then(setMemberships)
  }

  useEffect(reloadMemberships, [])

  if (memberships === null) {
    return <Loading />
  }

  const year = new Date().getFullYear()

  return (
    <>
      <div className="mb-3">
        The table below contains a list of clubs that you are a member of. If
        you are an officer of a club and the club has not been renewed yet for
        the {year}-{year + 1} school year, you can use the Renew button to start
        the renewal process.
      </div>
      <div className="mb-3">
        If you encounter any issues during the renewal process, please email{' '}
        <Contact />.
      </div>
      {memberships.length ? (
        <RenewTabTable className={className} memberships={memberships} />
      ) : (
        <>
          <EmptyState name="button" />
          <Center>
            <Text isGray>
              You are not listed as an officer for any clubs yet. If you would
              like to request access for an existing club, please send your
              name, PennKey, and club to <Contact />.
            </Text>
          </Center>
        </>
      )}
    </>
  )
}
