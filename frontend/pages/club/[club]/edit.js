import { withRouter } from 'next/router'

import ClubEditPage from '../../../components/ClubEditPage'
import renderPage from '../../../renderPage'
import { doApiRequest, isClubFieldShown } from '../../../utils'

const Edit = (props) => <ClubEditPage {...props} />

Edit.getInitialProps = async ({ query }) => {
  const endpoints = ['tags', 'schools', 'majors', 'years', 'student_types']
  return Promise.all(
    endpoints.map(async (item) => {
      if (!isClubFieldShown(item)) {
        return [item, []]
      }
      const request = await doApiRequest(`/${item}/?format=json`)
      const response = await request.json()
      return [item, response]
    }),
  ).then((values) => {
    const output = { clubId: query.club }
    values.forEach((item) => {
      output[item[0]] = item[1]
    })
    return output
  })
}

Edit.getAdditionalPermissions = (ctx) => {
  return [
    `clubs.manage_club:${ctx.query.club}`,
    `clubs.delete_club:${ctx.query.club}`,
  ]
}

Edit.permissions = ['clubs.delete_club']

export default withRouter(renderPage(Edit))
