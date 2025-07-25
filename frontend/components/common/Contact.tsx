import { ReactElement } from 'react'

import {
  CONTACT_EMAIL,
  OSA_EMAIL,
  SAC_EMAIL,
  SITE_ID,
  SUPPORT_EMAIL,
} from '../../utils/branding'

type ContactProps = {
  email?: string
  point?: 'pennclubs' | 'osa' | 'sac' | 'support'
}

export function Contact({
  email,
  point = 'pennclubs',
}: ContactProps): ReactElement<any> {
  let finalEmail = email || CONTACT_EMAIL

  if (SITE_ID === 'clubs') {
    if (point === 'osa') {
      finalEmail = OSA_EMAIL
    } else if (point === 'sac') {
      finalEmail = SAC_EMAIL
    } else if (point === 'support') {
      finalEmail = SUPPORT_EMAIL
    }
  }

  if (!/@/.test(finalEmail)) {
    return <>{finalEmail}</>
  }

  return <a href={`mailto:${finalEmail}`}>{finalEmail}</a>
}
