import ClubMetadata from 'components/ClubMetadata'
import { Contact, Metadata } from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Club } from 'types'
import { doApiRequest, formatResponse } from 'utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SHOW_MEMBERS,
} from 'utils/branding'

import { CLUBS_NAVY } from '~/constants/colors'
import { CLUB_ROUTE } from '~/constants/routes'

type Query = {
  club: string
  invite: string
  token: string
}

type InviteProps = {
  club: Club
  query: Query
  inviter: Inviter | null
  error: Error | null
}

type Inviter = {
  id: number
  name: string
  email: string
}

type Error = { [key: string]: string } | string

const InvitePageContainer = styled.div`
  display: grid;
  margin: auto;
  padding: 30px 50px;
  min-height: calc(100vh - 3.25rem);
  color: rgb(31, 32, 73);

  place-items: center;
  grid-template-columns: 1fr 350px;
  gap: 50px;
  max-width: 900px;

  @media only screen and (max-width: 900px) {
    display: flex;
    flex-direction: column-reverse;
    justify-content: center;
    padding: 30px;
    grid-template-columns: 1fr;
    img {
      margin-bottom: 15px;
    }
  }
`

const Invite = ({
  club,
  query,
  inviter: initialInviter,
  error: initialError,
  authenticated,
}: InviteProps & { authenticated: boolean | null }): ReactElement => {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(initialError)
  const [inviter, setInviter] = useState<Inviter | null>(initialInviter)

  const accept = (isPublic: boolean) => {
    if (query.invite === 'example') {
      router.push(CLUB_ROUTE(), CLUB_ROUTE(query.club))
      return
    }

    doApiRequest(`/clubs/${query.club}/invites/${query.invite}/?format=json`, {
      method: 'PATCH',
      body: {
        token: query.token,
        public: isPublic,
      },
    }).then((resp) => {
      if (resp.ok) {
        router.push(CLUB_ROUTE(), CLUB_ROUTE(query.club))
      } else {
        resp.json().then((data) => {
          setInviter(null)
          setError(data)
        })
      }
    })
  }

  const decline = () => {
    if (query.invite === 'example') {
      router.push(CLUB_ROUTE(), CLUB_ROUTE(query.club))
    }
    doApiRequest(`/clubs/${query.club}/invites/${query.invite}/?format=json`, {
      method: 'DELETE',
      body: {
        token: query.token,
      },
    }).then((resp) => {
      if (resp.ok) {
        router.push(CLUB_ROUTE(), CLUB_ROUTE(query.club))
      } else {
        resp.json().then((data) => {
          setInviter(null)
          setError(data)
        })
      }
    })
  }

  if (!authenticated) {
    return (
      <>
        <Metadata title={`${OBJECT_NAME_TITLE_SINGULAR} Invite`} />
        <AuthPrompt />
      </>
    )
  }

  if (error != null || inviter == null || !club.code) {
    return (
      <div className="has-text-centered" style={{ margin: 30, marginTop: 60 }}>
        <Metadata title={`${OBJECT_NAME_TITLE_SINGULAR} Invite`} />
        <h1 className="title is-2">404 Not Found</h1>
        {error != null ? (
          <p>An error occurred while processing your invitation.</p>
        ) : (
          <p>
            The {inviter == null ? 'invite' : OBJECT_NAME_SINGULAR} you are
            looking for does not exist. Perhaps it was already claimed?
          </p>
        )}
        <p>
          For assistance, please contact <Contact />.
        </p>
        <p>{error && formatResponse(error)}</p>
      </div>
    )
  }

  const { name, code, image_url: image } = club

  return (
    <>
      <ClubMetadata club={club} />
      <InvitePageContainer>
        <div>
          <h2
            className="title is-2"
            style={{
              color: CLUBS_NAVY,
            }}
          >
            You’re Invited!
          </h2>
          <div
            className="title is-4"
            style={{ fontWeight: 'normal', color: CLUBS_NAVY }}
          >
            <b>{inviter.name}</b> has invited you, <b>{inviter.email}</b>, to
            join{' '}
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)}>
              {name}
            </Link>
            .
          </div>
          <p style={{ marginBottom: 15, color: CLUBS_NAVY }}>
            By accepting this invitation, you will be able to view the contact
            information of other members and internal {OBJECT_NAME_SINGULAR}{' '}
            documents.
          </p>
          {SHOW_MEMBERS && (
            <p style={{ marginBottom: 15, color: CLUBS_NAVY }}>
              <label>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={() => setIsPublic(!isPublic)}
                />{' '}
                Make my membership to this {OBJECT_NAME_SINGULAR} public.
                Outsiders will be able to see my name and role in {name}.
              </label>
            </p>
          )}
          <div className="buttons">
            <button
              className="button is-medium is-link"
              onClick={() => accept(isPublic)}
            >
              Accept Invitation
            </button>
            <button
              className="button is-medium is-light"
              onClick={() => decline()}
            >
              Decline Invitation
            </button>
          </div>
        </div>
        {image && <img src={image} alt={name} style={{ maxWidth: 300 }} />}
      </InvitePageContainer>
    </>
  )
}

Invite.getInitialProps = async (ctx: NextPageContext): Promise<InviteProps> => {
  const { req, query } = ctx
  const reqData = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const clubRequest = await doApiRequest(
    `/clubs/${query.club}/?bypass=true&format=json`,
    reqData,
  )
  const clubResponse = await clubRequest.json()

  let inviter: Inviter | null = null
  let error: Error | null = null

  if (query.invite === 'example' && query.token === 'example') {
    inviter = {
      id: -1,
      name: '[Example name]',
      email: '[Example email]',
    }
  } else {
    const resp = await doApiRequest(
      `/clubs/${query.club}/invites/${query.invite}/?format=json`,
      reqData,
    )
    const data = await resp.json()
    if (resp.ok) {
      inviter = data
    } else {
      error = data
    }
  }

  return { query: query as Query, club: clubResponse, inviter, error }
}

export default renderPage(Invite)
