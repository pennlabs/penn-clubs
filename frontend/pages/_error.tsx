import { Center, Container, Metadata } from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { logException, logMessage } from 'utils/sentry'

import { HOME_ROUTE, SNOW } from '~/constants'
const Image = styled.img`
  margin-top: calc(1rem + 5vh);
  width: 100%;
  max-width: 18rem;
  margin-bottom: 1.5rem;
`

type ErrorProps = {
  statusCode?: number
  message?: string
}

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
      <Link href={HOME_ROUTE} className="button is-medium is-primary">
        Back to home
      </Link>
    </Center>
  </Container>
)

Error.getInitialProps = ({
  res,
  err,
}: NextPageContext): Promise<ErrorProps> => {
  const statusCode = (res && res.statusCode) || (err && err.statusCode) || 404
  let message = (err && err.message) || undefined

  if (!message) {
    if (statusCode === 404) {
      message = 'The page you were looking for does not exist.'
    } else {
      message = 'Something went wrong.'
    }
  } else {
    if (err != null) {
      logException(err, { statusCode, message })
    } else {
      logMessage(`${statusCode}: ${message}`)
    }
  }

  return Promise.resolve({ statusCode, message })
}

export default renderPage(Error)
