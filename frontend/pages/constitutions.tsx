import {
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
  Text,
} from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import { MembershipRank } from 'types'
import { doApiRequest, intersperse } from 'utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from 'utils/branding'

import { CLUB_ROUTE, SNOW } from '~/constants'

type Props = {
  clubs: {
    name: string
    code: string
    approved: boolean | null
    files: { name: string | null; url: string | null }[]
  }[]
}

const ConstitutionDirectory = ({ clubs }: Props): ReactElement<any> => {
  return (
    <>
      <Container fullHeight background={SNOW}>
        <Metadata title={`${OBJECT_NAME_TITLE} Constitution List`} />
        <InfoPageTitle>{OBJECT_NAME_TITLE} Constitution List</InfoPageTitle>
        <Text>
          This is an alphabetically sorted list of all {clubs.length}{' '}
          {OBJECT_NAME_PLURAL} associated with the{' '}
          <b>Student Activities Council</b> on {SITE_NAME}. All clubs affiliated
          with the Student Activities Council must have a {OBJECT_NAME_SINGULAR}{' '}
          constitution uploaded.
        </Text>
        <Text className="mb-5">
          If you are an{' '}
          {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer].toLowerCase()} of a{' '}
          {OBJECT_NAME_SINGULAR} and do not have a constitution uploaded, you
          can do so on your "Manage {OBJECT_NAME_SINGULAR}" page at the bottom
          of the "Resources" tab. Ensure that your constitution is in ".docx" or
          ".pdf" format.
        </Text>
        <div className="content">
          <table>
            <thead>
              <tr>
                <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                <th>Approval Status</th>
                <th>Has Constitution</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => {
                const hasConstitution = club.files && club.files.length

                return (
                  <tr key={club.code}>
                    <td>
                      <Link
                        legacyBehavior
                        href={CLUB_ROUTE()}
                        as={CLUB_ROUTE(club.code)}
                      >
                        <a>{club.name}</a>
                      </Link>
                    </td>
                    <td>
                      {club.approved == null ? (
                        <span className="has-text-warning">
                          <Icon name="clock" /> Pending
                        </span>
                      ) : club.approved ? (
                        <span className="has-text-success">
                          <Icon name="check" /> Approved
                        </span>
                      ) : (
                        <span className="has-text-danger">
                          <Icon name="x" /> Not Approved
                        </span>
                      )}
                    </td>
                    <td>
                      {hasConstitution ? (
                        <span className="has-text-info">
                          <Icon name="file" /> Exists -{' '}
                          {intersperse(
                            club.files.map((file) =>
                              file.url != null ? (
                                <a href={file.url} rel="noopener noreferrer">
                                  {file.name}
                                </a>
                              ) : (
                                file.name ?? 'Hidden'
                              ),
                            ),
                            ', ',
                          )}
                        </span>
                      ) : (
                        <span className="has-text-danger">
                          <Icon name="x" /> Missing
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </>
  )
}

ConstitutionDirectory.getInitialProps = async (ctx: NextPageContext) => {
  const request = await doApiRequest('/clubs/constitutions/?format=json', {
    headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
  })
  const response = await request.json()

  return { clubs: response }
}

export default renderPage(ConstitutionDirectory)
