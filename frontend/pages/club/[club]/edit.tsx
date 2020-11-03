import { NextPageContext } from 'next'
import { ReactElement } from 'react'

import ClubEditPage from '../../../components/ClubEditPage'
import renderPage from '../../../renderPage'
import { Major, School, StudentType, Tag, Year } from '../../../types'
import { doApiRequest, isClubFieldShown } from '../../../utils'

type EditPageProps = {
  clubId: string
  tags: Tag[]
  schools: School[]
  majors: Major[]
  years: Year[]
  student_types: StudentType[]
}

const Edit = (
  props: React.ComponentProps<typeof ClubEditPage>,
): ReactElement => {
  return <ClubEditPage {...props} />
}

Edit.getInitialProps = async ({ query }): Promise<EditPageProps> => {
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
