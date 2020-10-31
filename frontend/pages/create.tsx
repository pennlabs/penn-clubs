import ClubEditPage from '../components/ClubEditPage'
import ResourceCreationPage from '../components/ResourceCreationPage'
import renderPage from '../renderPage'
import { doApiRequest, isClubFieldShown } from '../utils'
import { SITE_ID } from '../utils/branding'

const Create = (props) =>
  SITE_ID === 'fyh' ? (
    <ResourceCreationPage {...props} />
  ) : (
    <ClubEditPage {...props} />
  )

Create.getInitialProps = async () => {
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
    const output = {}
    values.forEach((item) => {
      output[item[0]] = item[1]
    })
    return output
  })
}

export default renderPage(Create)
