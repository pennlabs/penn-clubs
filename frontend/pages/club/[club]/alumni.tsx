import ClubMetadata from 'components/ClubMetadata'
import { Container, StrongText, Text, Title } from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import { Club } from 'types'
import { doApiRequest } from 'utils'

import { CLUB_ROUTE, PROFILE_ROUTE } from '~/constants'

type AlumniPageProps = {
  club: Club
  alumni:
    | { [year: string]: { name: string; username: string | null }[] }
    | { detail: string }
}

const AlumniPage = ({ club, alumni }: AlumniPageProps): ReactElement => {
  return (
    <>
      <ClubMetadata club={club} />
      <Container paddingTop>
        <div className="is-clearfix">
          <div className="is-pulled-left">
            <Title>{club.name} Alumni</Title>
          </div>
          <Link
            href={CLUB_ROUTE()}
            as={CLUB_ROUTE(club.code)}
            className="button is-pulled-right is-secondary is-medium"
          >
            Back
          </Link>
        </div>
        <Text>
          This page shows all of the past members of {club.name} who have chosen
          to make their membership public.
        </Text>
        <hr />
        {'detail' in alumni && typeof alumni.detail === 'string' ? (
          <Text>{alumni.detail}</Text>
        ) : (
          <>
            {Object.keys(alumni)
              .sort((a, b) =>
                a == null ? 1 : b == null ? -1 : parseInt(b) - parseInt(a),
              )
              .map((year) => (
                <div key={year} className="content">
                  <StrongText>
                    {year != null ? <>Class of {year}</> : 'Miscellaneous'}
                  </StrongText>
                  <ul>
                    {alumni[year]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((user) => (
                        <li>
                          {user.username ? (
                            <Link
                              legacyBehavior
                              href={PROFILE_ROUTE()}
                              as={PROFILE_ROUTE(user.username)}
                            >
                              <a>{user.name}</a>
                            </Link>
                          ) : (
                            user.name
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            {Object.keys(alumni).length <= 0 && (
              <Text>There are no alumni to display for {club.name}.</Text>
            )}
          </>
        )}
      </Container>
    </>
  )
}

AlumniPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [clubReq, alumniReq] = await Promise.all([
    doApiRequest(`/clubs/${query.club}/?format=json`, data),
    doApiRequest(`/clubs/${query.club}/alumni/?format=json`, data),
  ])

  const clubRes = await clubReq.json()
  const alumniRes = await alumniReq.json()

  return { club: clubRes, alumni: alumniRes }
}

export default renderPage(AlumniPage)
