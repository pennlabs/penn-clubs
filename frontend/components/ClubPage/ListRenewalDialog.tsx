import Link from 'next/link'
import { ReactElement } from 'react'

import { USER_RENEWAL } from '../../constants'

const ListRenewalDialog = (): ReactElement => {
  const year = new Date().getFullYear()

  return (
    <div className="notification is-info is-clearfix">
      <img
        className="is-pulled-left mr-5 mb-3"
        style={{ width: 100 }}
        src="/static/img/bookmarks2.svg"
      />
      <div>
        <p className="mb-3">
          All clubs on Penn Clubs are undergoing the annual Office of Student
          Affairs renewal process for the {year}-{year + 1} school year. This
          may explain why this club list seems oddly empty. If you are an
          officer of a club, click the button below to start renewing your club!
        </p>
        <Link href={USER_RENEWAL} as={USER_RENEWAL}>
          <a className="button is-info is-light">Renew Clubs</a>
        </Link>
      </div>
    </div>
  )
}

export default ListRenewalDialog
