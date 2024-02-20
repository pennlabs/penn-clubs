import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CREATE_ROUTE, DIRECTORY_ROUTE } from '../../constants'
import { UserInfo, UserMembership } from '../../types'
import { doApiRequest, getCurrentSchoolYear } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
} from '../../utils/branding'
import { Center, Contact, EmptyState, Loading, Text } from '../common'
import RenewTabTable from './RenewTabTable'

type ClubTabProps = {
  className?: string
  userInfo: UserInfo
}

const RenewTab = ({ className }: ClubTabProps): ReactElement => {
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

  const year = getCurrentSchoolYear()

  return (
    <>
      <div className="mb-3">
        The table below contains a list of {OBJECT_NAME_PLURAL} that you are a
        member of. If you are a member of a {OBJECT_NAME_SINGULAR} and the{' '}
        {OBJECT_NAME_SINGULAR} has not been renewed yet for the {year}-
        {year + 1} school year, you can use the Renew button to start the
        renewal process.
      </div>
      <div className="mb-3">
        If you do not see your {OBJECT_NAME_SINGULAR} in the list below, please
        check the{' '}
        <Link legacyBehavior href={DIRECTORY_ROUTE} as={DIRECTORY_ROUTE}>
          <a>directory page</a>
        </Link>{' '}
        to see if it exists. If your {OBJECT_NAME_SINGULAR} does exist, email{' '}
        <Contact /> to gain access. If your {OBJECT_NAME_SINGULAR} does not
        exist, fill out the form found{' '}
        <Link legacyBehavior href={CREATE_ROUTE} as={CREATE_ROUTE}>
          <a>here</a>
        </Link>
        .
      </div>
      <div className="mb-3">
        If you encounter any technical issues during the renewal process, please
        email <Contact />. For any questions about the approval process, please
        email the {APPROVAL_AUTHORITY} at <Contact point="osa" />.
      </div>
      {memberships.length ? (
        <RenewTabTable className={className} memberships={memberships} />
      ) : (
        <>
          <EmptyState name="button" />
          <Center>
            <Text isGray>
              You are not listed as an officer for any {OBJECT_NAME_PLURAL} yet.
              If you would like to request access for an existing{' '}
              {OBJECT_NAME_SINGULAR}, please send your name, PennKey, and{' '}
              {OBJECT_NAME_SINGULAR} name to <Contact />.
            </Text>
          </Center>
        </>
      )}
    </>
  )
}

export default RenewTab
