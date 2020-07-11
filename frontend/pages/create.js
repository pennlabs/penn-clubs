import { withRouter } from 'next/router'

import ClubEditPage from '../components/ClubEditPage'
import renderPage from '../renderPage.js'
import { doApiRequest } from '../utils'

const Create = (props) => <ClubEditPage {...props} />

Create.getInitialProps = async ({ query }) => {
  const endpoints = ['tags', 'schools', 'majors', 'years']
  return Promise.all(
    endpoints.map(async (item) => {
      const request = await doApiRequest(`/${item}/?format=json`)
      const response = await request.json()
      return [item, response]
    }),
  ).then((values) => {
    const output = {}
    values.forEach((item) => {
      output[item[0]] = item[1]
    })
    return output
  })
}

export default withRouter(renderPage(Create))
