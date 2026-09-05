import Link from 'next/link'
import { ReactElement } from 'react'

import { APPLY_ROUTE } from '../../constants'

/**
 * Points people at the application dashboard while it is still new to them.
 *
 * Rendered only for signed-in users: the tracker needs a session, so showing
 * it to a visitor would promise something that bounces them to a login page.
 * APPLICATION_TRACKER_BANNER switches it on; setting
 * APPLICATION_TRACKER_BANNER_UNTIL to a date retires it on its own.
 */
const ListTrackerDialog = (): ReactElement<any> => {
  return (
    <div className="notification is-info is-light is-clearfix">
      <div>
        <p className="mb-3">
          <b>Try the application tracker.</b> Deadlines, what&#39;s left to fill
          out, and anything you&#39;ve heard back, all in one place.
        </p>
        <Link
          href={APPLY_ROUTE}
          as={APPLY_ROUTE}
          className="button is-info is-small"
        >
          Open the tracker
        </Link>
      </div>
    </div>
  )
}

export default ListTrackerDialog
