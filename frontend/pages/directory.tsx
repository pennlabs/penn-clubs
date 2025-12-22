import { Container, InfoPageTitle, Metadata } from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Club, UserInfo } from 'types'
import { doApiRequest } from 'utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_TITLE,
  SITE_NAME,
} from 'utils/branding'

import { SNOW } from '~/constants'

type Props = {
  clubs: Club[]
  userInfo?: UserInfo
}

const DirectoryList = styled.ul`
  list-style-type: circle;
  -webkit-column-count: 2;
  -moz-column-count: 2;
  column-count: 2;

  -webkit-column-gap: 40px;
  -moz-column-gap: 40px;
  column-gap: 40px;

  margin-left: 2em;

  & li {
    margin-bottom: 8px;
  }
`

const Directory = ({ clubs, userInfo }: Props): ReactElement<any> => {
  return (
    <>
      <Container fullHeight background={SNOW}>
        <Metadata title={`${OBJECT_NAME_TITLE} Directory`} />
        <InfoPageTitle>{OBJECT_NAME_TITLE} Directory</InfoPageTitle>
        <p className="mb-5 has-text-grey">
          {userInfo === undefined ? (
            <>
              The directory is an alphabetically sorted list of all{' '}
              {clubs.length} {OBJECT_NAME_PLURAL} on {SITE_NAME} that have
              elected to be visible to the public.
            </>
          ) : (
            <>
              The directory is an alphabetically sorted list of all{' '}
              {clubs.length} {OBJECT_NAME_PLURAL} on {SITE_NAME}.{' '}
              {OBJECT_NAME_TITLE} that are either inactive or pending approval
              are displayed in grey.
            </>
          )}
        </p>
        <DirectoryList>
          {clubs.map((club) => (
            <li
              key={club.code}
              className={!club.approved ? 'has-text-grey' : undefined}
            >
              <Link href={`/club/${club.code}`} passHref legacyBehavior>
                <a style={{ color: 'inherit', textDecoration: 'none' }}>
                  {club.name}
                </a>
              </Link>
            </li>
          ))}
        </DirectoryList>
      </Container>
    </>
  )
}

Directory.getInitialProps = async (ctx: NextPageContext) => {
  const request = await doApiRequest('/clubs/directory/?format=json', {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  })
  const response = await request.json()

  return { clubs: response }
}

export default renderPage(Directory)
