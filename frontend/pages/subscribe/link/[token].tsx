import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useContext, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import { doApiRequest } from 'utils'

import { Container, Loading, Text, Title } from '~/components/common'
import { AuthCheckContext } from '~/components/contexts'

type ResolvedLink = {
  subscription_group_id: number
  club_code: string
  group_name: string
  is_active: boolean
  is_archived: boolean
  auto_subscribe_eligible: boolean
  attribution_source: string
}

function MagicLinkPage(): ReactElement<any> {
  const router = useRouter()
  const { token } = router.query as { token: string }
  const authCheck = useContext(AuthCheckContext)

  const [resolved, setResolved] = useState<ResolvedLink | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    doApiRequest(`/subscription-links/${token}/?format=json`)
      .then(async (resp) => {
        if (!resp.ok) {
          const data = await resp.json()
          setError(data.detail ?? 'Invalid or expired link.')
          return
        }
        const data: ResolvedLink = await resp.json()
        setResolved(data)
      })
      .catch(() => setError('Failed to resolve link.'))
  }, [token])

  useEffect(() => {
    if (!resolved) return

    if (resolved.is_archived || !resolved.is_active) {
      // Nothing to do — will render an informational message below
      return
    }

    if (resolved.auto_subscribe_eligible) {
      // No questions to answer — send them through auth then subscribe directly
      authCheck(() => {
        doApiRequest(
          `/subscription-groups/${resolved.subscription_group_id}/submit/?format=json`,
          {
            method: 'POST',
            body: {
              subscription_group: resolved.subscription_group_id,
              answers: [],
              attribution_source: resolved.attribution_source,
            },
          },
        ).then((resp) => {
          if (resp.ok) {
            router.replace(`/club/${resolved.club_code}`)
          } else {
            // Fall back to the form page, which prompts for login if needed.
            router.replace(
              `/club/${resolved.club_code}/subscribe/` +
                `${resolved.subscription_group_id}?source=${resolved.attribution_source}`,
            )
          }
        })
      })
    } else {
      // Has questions — redirect to the form page with attribution
      router.replace(
        `/club/${resolved.club_code}/subscribe/${resolved.subscription_group_id}?source=${resolved.attribution_source}`,
      )
    }
  }, [resolved])

  if (error) {
    return (
      <Container>
        <Title>Invalid Link</Title>
        <div className="notification is-danger">{error}</div>
      </Container>
    )
  }

  if (!resolved) {
    return (
      <Container>
        <Loading />
      </Container>
    )
  }

  if (resolved.is_archived || !resolved.is_active) {
    return (
      <Container>
        <Title>{resolved.group_name}</Title>
        <div className="notification is-warning">
          This subscription form is no longer active.
        </div>
        <Link href={`/club/${resolved.club_code}`} className="button">
          View Club Page
        </Link>
      </Container>
    )
  }

  // Still loading / redirecting
  return (
    <Container>
      <Text>Redirecting you to the subscription form…</Text>
      <Loading />
    </Container>
  )
}

MagicLinkPage.getInitialProps = async (_ctx: NextPageContext) => ({})

export default renderPage(MagicLinkPage)
