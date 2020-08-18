import { ReactElement } from 'react'

type ContactProps = {
  email?: string
  point?: 'pennclubs' | 'osa'
}

export function Contact({
  email,
  point = 'pennclubs',
}: ContactProps): ReactElement {
  let finalEmail = email || 'contact@pennclubs.com'

  if (point === 'osa') {
    finalEmail = 'rodneyr@upenn.edu'
  }

  return <a href={`mailto:${finalEmail}`}>{finalEmail}</a>
}
