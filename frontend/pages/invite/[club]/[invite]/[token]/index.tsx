import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'

import { Contact } from '../../../../../components/common'
import { CLUB_ROUTE } from '../../../../../constants/routes'
import renderPage from '../../../../../renderPage'
import { Club } from '../../../../../types'
import { doApiRequest, formatResponse, LOGIN_URL } from '../../../../../utils'

type Query = {
  club: string
  invite: string
  token: string
}

type InviteProps = {
  club: Club
  query: Query
}

type Inviter = {
  id: number
  name: string
  email: string
}

type Error = { [key: string]: string }

const Invite = ({ club, query }: InviteProps): ReactElement => {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [inviter, setInviter] = useState<Inviter | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const accept = (isPublic: boolean) => {
    doApiRequest(`/clubs/${query.club}/invites/${query.invite}/?format=json`, {
      method: 'PATCH',
      body: {
        token: query.token,
        public: isPublic,
      },
    }).then((resp) => {
      if (resp.ok) {
        router.push('/club/[club]', `/club/${query.club}`)
      } else {
        resp.json().then((data) => {
          setInviter(null)
          setError(data)
        })
      }
    })
  }

  useEffect(() => {
    if (query.invite === 'example' && query.token === 'example') {
      setInviter({
        id: -1,
        name: '[Example name]',
        email: '[Example email]',
      })
    } else {
      doApiRequest(
        `/clubs/${query.club}/invites/${query.invite}/?format=json`,
      ).then((resp) => {
        resp.json().then((data) => {
          if (resp.ok) {
            setInviter(data)
          } else if (
            resp.status === 403 &&
            data.detail === 'Authentication credentials were not provided.'
          ) {
            window.location.href = `${LOGIN_URL}?next=${window.location.pathname}`
          } else {
            setError(data)
          }
        })
      })
    }
  }, [])

  if (!inviter || !club.code) {
    if (error) {
      return (
        <div
          className="has-text-centered"
          style={{ margin: 30, marginTop: 60 }}
        >
          <h1 className="title is-2">404 Not Found</h1>
          <p>
            The invite you are looking for does not exist. Perhaps it was
            already claimed?
          </p>
          <p>
            If you believe that this is an error, please contact <Contact />.
          </p>
          <p>{error && formatResponse(error)}</p>
        </div>
      )
    } else {
      return (
        <div
          className="has-text-centered"
          style={{ margin: 30, marginTop: 60 }}
        >
          <h1 className="title is-2">Loading...</h1>
          <p>Processing your invitation...</p>
        </div>
      )
    }
  }

  const { name, code, image_url: image } = club

  return (
    <div style={{ padding: '30px 50px' }} className="has-text-centered">
      {/* &#x1F389; is the confetti emoji. */}
      <h2 className="title is-2">&#x1F389; Invitation for {name} &#x1F389;</h2>
      <div className="title is-4" style={{ fontWeight: 'normal' }}>
        <b>{inviter.name}</b> has invited you, <b>{inviter.email}</b>, to join{' '}
        <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
          <a>{name}</a>
        </Link>
        .
      </div>
      {image && (
        <img
          src={image}
          alt={name}
          style={{ maxHeight: 100, marginBottom: 15 }}
        />
      )}
      <p style={{ marginBottom: 15 }}>
        By accepting this invitation, you will be able to view the contact
        information of other members and internal club documents.
      </p>
      <p>
        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />{' '}
          Make my membership to this club public. Outsiders will be able to see
          my name and role in {name}.
        </label>
      </p>
      <br />
      <button
        className="button is-large is-success"
        onClick={() => accept(isPublic)}
      >
        Accept Invitation
      </button>
    </div>
  )
}

Invite.getInitialProps = async (ctx: NextPageContext) => {
  const { query } = ctx

  const clubRequest = await doApiRequest(
    `/clubs/${query.club}/?bypass=true&format=json`,
  )
  const clubResponse = await clubRequest.json()

  return { query, club: clubResponse }
}

export default renderPage(Invite)
