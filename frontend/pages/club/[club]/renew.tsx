import { NextPageContext } from 'next'
import { ReactElement } from 'react'

import renderPage from '../../../renderPage'
import { Club } from '../../../types'
import { doApiRequest } from '../../../utils'

type RenewPageProps = {
  club: Club
}

const RenewPage = ({ club }: RenewPageProps): ReactElement => {
  return <div></div>
}

RenewPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const clubReq = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const clubRes = await clubReq.json()

  return { club: clubRes }
}

export default renderPage(RenewPage)
