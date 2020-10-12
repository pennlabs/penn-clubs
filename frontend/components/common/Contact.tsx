import { ReactElement } from 'react'

import { CONTACT_EMAIL } from '../../utils/branding'

type ContactProps = {
  email?: string
  point?: 'pennclubs' | 'osa' | 'sac'
}

export function Contact({
  email,
  point = 'pennclubs',
}: ContactProps): ReactElement {
  let finalEmail = email || CONTACT_EMAIL

  if (point === 'osa') {
    finalEmail = 'rodneyr@upenn.edu'
  } else if (point === 'sac') {
    finalEmail = 'sac@sacfunded.net'
  }

  return <a href={`mailto:${finalEmail}`}>{finalEmail}</a>
}
