import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'
import s from 'styled-components'

import { Center, Container, Metadata } from '../components/common'
import { SNOW } from '../constants/colors'
import { HOME_ROUTE } from '../constants/routes'
import renderPage from '../renderPage'
import { captureMessage } from '../utils/sentry'

const Image = s.img`
  margin-top: calc(1rem + 5vh);
  width: 100%;
  max-width: 18rem;
  margin-bottom: 1.5rem;
`

const Error = ({
  statusCode = 500,
  message = 'Something went wrong',
}: ErrorProps): ReactElement => (
  <Container background={SNOW} fullHeight>
    <Metadata />
    <Center>
      <Image src="/static/img/button.svg" alt="something went wrong" />
      <h1
        className="is-size-1"
        style={{ marginBottom: '0.2rem', fontWeight: 'bold' }}
      >
        {statusCode}: Oh no!
      </h1>
      <p className="is-size-5" style={{ marginBottom: '1rem' }}>
        {message}
      </p>
      <Link href={HOME_ROUTE}>
        <a className="button is-medium is-primary">Back to home</a>
      </Link>
    </Center>
  </Container>
)

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = (res && res.statusCode) || (err && err.statusCode) || 404
  let message = (err && err.message) || undefined

  if (!message) {
    if (statusCode === 404) {
      message = 'The page you were looking for does not exist.'
    } else {
      message = 'Something went wrong.'
    }
  } else {
    captureMessage(`${statusCode}: ${message}`)
  }

  return { statusCode, message }
}

type ErrorProps = {
  statusCode?: number
  message?: string
}

export default renderPage(Error)
