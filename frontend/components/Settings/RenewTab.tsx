import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CREATE_ROUTE, DIRECTORY_ROUTE } from '../../constants'
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
        If you do not see your club in the list below, please check the{' '}
        <Link href={DIRECTORY_ROUTE} as={DIRECTORY_ROUTE}>
          <a>directory page</a>
        </Link>{' '}
        to see if it exists. If your club does exist, email <Contact /> to gain
        access. If your club does not exist, fill out the form found{' '}
        <Link href={CREATE_ROUTE} as={CREATE_ROUTE}>
          <a>here</a>
        </Link>
        .
      </div>
      <div className="mb-3">
        If you encounter any technical issues during the renewal process, please
        email <Contact />. For any questions about the approval process, please
        email the Office of Student Affairs at <Contact point="osa" />.
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
