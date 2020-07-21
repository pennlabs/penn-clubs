import { ReactElement } from 'react'

type ContactProps = {
  email?: string
}

export function Contact({
  email = 'contact@pennclubs.com',
}: ContactProps): ReactElement {
  return <a href={`mailto:${email}`}>{email}</a>
}
