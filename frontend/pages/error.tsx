import Head from 'next/head'
import styled from 'styled-components'

import { Text } from '~/components/common'
import { BODY_FONT } from '~/constants'
import { SITE_LOGO, SITE_NAME } from '~/utils/branding'

const Main = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;

  padding: 0 20px;
  box-sizing: border-box;

  font-family: ${BODY_FONT};
`

const ErrorPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Error | Penn Clubs</title>
        <style global>
          {`
            body {
              margin: 0;
            }
          `}
        </style>
      </Head>
      <Main>
        <div>
          <img
            src={SITE_LOGO}
            alt={`${SITE_NAME} Logo`}
            style={{
              width: '120px',
            }}
          />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: '2rem',
            }}
          >
            Aw, Snap!
          </Text>
          <Text
            style={{
              fontSize: '1rem',
              color: '#5a6978',
            }}
          >
            We are currently experiencing some issues trying to load this page.
            <br />
            If you believe this is a critical issue, please contact us at{' '}
            <a href="mailto:contact@pennclubs.com" style={{ color: '#3273dc' }}>
              contact@pennclubs.com
            </a>
            .
          </Text>
        </div>
      </Main>
    </>
  )
}

export default ErrorPage
