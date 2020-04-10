import ClubEditPage from '../../../components/ClubEditPage'
import { withRouter } from 'next/router'
import renderPage from '../../../renderPage.js'
import { doApiRequest } from '../../../utils'

const Edit = props => <ClubEditPage {...props} />

Edit.getInitialProps = async ({ query }) => {
  const endpoints = ['tags', 'schools', 'majors', 'years']
  return Promise.all(
    endpoints.map(async item => {
      const request = await doApiRequest(`/${item}/?format=json`)
      const response = await request.json()
      return [item, response]
    })
  ).then(values => {
    const output = { clubId: query.club }
    values.forEach(item => {
      output[item[0]] = item[1]
    })
    return output
  })
}

export default withRouter(renderPage(Edit))
