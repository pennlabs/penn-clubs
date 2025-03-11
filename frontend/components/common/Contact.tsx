import { ReactElement } from 'react'

import { CONTACT_EMAIL, SITE_ID } from '../../utils/branding'

type ContactProps = {
  email?: string
  point?: 'pennclubs' | 'osa' | 'sac'
}

export function Contact({
  email,
  point = 'pennclubs',
}: ContactProps): ReactElement<any> {
  let finalEmail = email || CONTACT_EMAIL

  if (SITE_ID === 'clubs') {
    if (point === 'osa') {
      finalEmail = 'vpul-pennosa@pobox.upenn.edu'
    } else if (point === 'sac') {
      finalEmail = 'sac@sacfunded.net'
    }
  }

  if (!/@/.test(finalEmail)) {
    return <>{finalEmail}</>
  }

  return <a href={`mailto:${finalEmail}`}>{finalEmail}</a>
}
