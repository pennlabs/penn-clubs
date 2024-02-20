import Link from 'next/link'
import { ReactElement } from 'react'

import { DIRECTORY_ROUTE, USER_RENEWAL } from '../../constants'
import { getCurrentSchoolYear } from '../../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  SITE_NAME,
} from '../../utils/branding'

const ListRenewalDialog = (): ReactElement => {
  const year = getCurrentSchoolYear()

  return (
    <div className="notification is-info is-clearfix">
      <img
        className="is-pulled-left mr-5 mb-3"
        style={{ width: 100 }}
        src="/static/img/bookmarks2.svg"
      />
      <div>
        <p className="mb-3">
          All {OBJECT_NAME_PLURAL} on {SITE_NAME} are undergoing the annual{' '}
          {APPROVAL_AUTHORITY} renewal process for the {year}-{year + 1} school
          year. If you are an officer of a {OBJECT_NAME_SINGULAR}, click the
          button below to start renewing your {OBJECT_NAME_SINGULAR}! During
          this process, you will also have the option to register for upcoming{' '}
          {OBJECT_NAME_SINGULAR} fairs. For a complete list of{' '}
          {OBJECT_NAME_PLURAL}, see{' '}
          <Link href={DIRECTORY_ROUTE} as={DIRECTORY_ROUTE}>
            this page
          </Link>
          .
        </p>
        <Link
          href={USER_RENEWAL}
          as={USER_RENEWAL}
          className="button is-info is-light"
        >
          Renew{OBJECT_NAME_TITLE}
        </Link>
      </div>
    </div>
  )
}

export default ListRenewalDialog
