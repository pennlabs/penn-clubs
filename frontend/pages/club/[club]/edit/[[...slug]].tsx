import ClubEditPage from 'components/ClubEditPage'
import { NextPageContext } from 'next'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import { doApiRequest, isClubFieldShown } from 'utils'

type EditPageProps = React.ComponentProps<typeof ClubEditPage>

const Edit = (props: EditPageProps): ReactElement<any> => {
  return <ClubEditPage {...props} />
}

Edit.getInitialProps = async ({ query }): Promise<EditPageProps> => {
  const endpoints = [
    'tags',
    'schools',
    'majors',
    'years',
    ['student_types', 'studentTypes'],
    'categories',
  ]
  return Promise.all(
    endpoints.map(async (item) => {
      const endpoint = typeof item === 'string' ? item : item[0]
      const name = typeof item === 'string' ? item : item[1]
      if (!isClubFieldShown(endpoint)) {
        return [endpoint, []]
      }
      const request = await doApiRequest(`/${endpoint}/?format=json`)
      const response = await request.json()
      return [name, response]
    }),
  ).then((values) => {
    const output = { clubId: query.club, tab: query.slug?.[0] }
    values.forEach((item) => {
      output[item[0]] = item[1]
    })
    return output
  }) as Promise<EditPageProps>
}

Edit.getAdditionalPermissions = (ctx: NextPageContext): string[] => {
  return [
    `clubs.manage_club:${ctx.query.club}`,
    `clubs.delete_club:${ctx.query.club}`,
  ]
}

Edit.permissions = ['clubs.delete_club']

export default renderPage(Edit)
