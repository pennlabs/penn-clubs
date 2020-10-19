import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import s from 'styled-components'

import { Container, Metadata, Title } from '../components/common'
import { SNOW } from '../constants'
import renderPage from '../renderPage'
import { Club } from '../types'
import { doApiRequest } from '../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  SITE_NAME,
} from '../utils/branding'

type Props = {
  clubs: Club[]
}

const DirectoryList = s.ul`
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

const DirectoryTitle = s(Title)`
  padding-top: 2.5vw;
`

const Directory = ({ clubs }: Props): ReactElement => {
  return (
    <>
      <Container fullHeight background={SNOW}>
        <Metadata title={`${OBJECT_NAME_TITLE} Directory`} />
        <DirectoryTitle>{OBJECT_NAME_TITLE} Directory</DirectoryTitle>
        <p className="mb-5 has-text-grey">
          The directory is an alphabetically sorted list of all {clubs.length}{' '}
          {OBJECT_NAME_PLURAL} on {SITE_NAME}, including the{' '}
          {clubs.filter((club) => !club.approved).length} {OBJECT_NAME_PLURAL}{' '}
          that have not yet been approved. If a {OBJECT_NAME_SINGULAR} exists
          but has not been approved, it is shown in grey in the list below.
        </p>
        <DirectoryList>
          {clubs.map((club) => (
            <li
              key={club.code}
              className={!club.approved ? 'has-text-grey' : undefined}
            >
              {club.name}
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
