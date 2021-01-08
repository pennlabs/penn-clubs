import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement } from 'react'

import ClubMetadata from '../../../components/ClubMetadata'
import { Container, Text, Title } from '../../../components/common'
import { CLUB_ROUTE } from '../../../constants'
import renderPage from '../../../renderPage'
import { Club } from '../../../types'
import { doApiRequest } from '../../../utils'

type Props = {
  club: Club
}

const ApplyPage = ({ club }: Props): ReactElement => {
  return (
    <>
      <ClubMetadata club={club} />
      <Container paddingTop>
        <div className="is-clearfix">
          <Title className="is-pulled-left">{club.name} Application</Title>
          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
            <a className="button is-pulled-right is-secondary is-medium">
              Back
            </a>
          </Link>
        </div>
        <hr />
        <div className="has-text-centered">
          <Text>This page is still under construction. Check back soon!</Text>
          <img
            src="/static/img/underconstruction.png"
            alt="Under Construction"
            style={{ maxWidth: 600 }}
          />
        </div>
      </Container>
    </>
  )
}

ApplyPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  return { club: clubRes }
}

export default renderPage(ApplyPage)
