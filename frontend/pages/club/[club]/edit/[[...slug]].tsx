import ClubEditPage from 'components/ClubEditPage'
import { NextPageContext } from 'next'
import { useRouter } from 'next/router'
import { ReactElement, useEffect } from 'react'
import { toast } from 'react-toastify'
import renderPage from 'renderPage'
import { doApiRequest, isClubFieldShown } from 'utils'

type EditPageProps = React.ComponentProps<typeof ClubEditPage>

const Edit = (props: EditPageProps): ReactElement<any> => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const value = router.query.visibility_link
    if (value !== 'expired' && value !== 'invalid' && value !== 'missing')
      return

    if (value === 'expired') {
      toast.error(
        'This public visibility link has expired. Please use the Visibility setting below.',
      )
    } else if (value === 'invalid') {
      toast.error(
        'This public visibility link is invalid. Please use the Visibility setting below.',
      )
    } else {
      toast.error(
        'This public visibility link is missing information. Please use the Visibility setting below.',
      )
    }

    const { visibility_link, ...rest } = router.query
    router.replace({ pathname: router.pathname, query: rest }, undefined, {
      shallow: true,
    })
  }, [router.isReady, router.query.visibility_link])

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
    'eligibilities',
    'types',
    'classifications',
    'statuses',
    ['group_activity_options', 'groupActivityOptions'],
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

Edit.permissions = ['clubs.approve_club', 'clubs.see_pending_clubs']

export default renderPage(Edit)
