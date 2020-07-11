import { Component } from 'react'
import Link from 'next/link'
import { withRouter } from 'next/router'

import { CLUB_ROUTE } from '../../../../../constants/routes'
import renderPage from '../../../../../renderPage'
import { doApiRequest, formatResponse, LOGIN_URL } from '../../../../../utils'

class Invite extends Component {
  constructor(props) {
    super(props)
    this.state = {
      invite: null,
      error: null,
      isPublic: true,
    }

    this.accept = this.accept.bind(this)
  }

  componentDidMount() {
    const { query } = this.props
    if (query.invite === 'example' && query.token === 'example') {
      this.setState({
        invite: {
          id: -1,
          name: '[Example name]',
          email: '[Example email]',
        },
      })
    } else {
      doApiRequest(
        `/clubs/${query.club}/invites/${query.invite}/?format=json`,
      ).then(resp => {
        resp.json().then(data => {
          if (resp.ok) {
            this.setState({ invite: data })
          } else if (
            resp.status === 403 &&
            data.detail === 'Authentication credentials were not provided.'
          ) {
            window.location.href = `${LOGIN_URL}?next=${window.location.pathname}`
          } else {
            this.setState({ error: data })
          }
        })
      })
    }
  }

  accept(isPublic) {
    const { query, router } = this.props
    doApiRequest(`/clubs/${query.club}/invites/${query.invite}/?format=json`, {
      method: 'PATCH',
      body: {
        token: query.token,
        public: isPublic,
      },
    }).then(resp => {
      if (resp.ok) {
        router.push('/club/[club]', `/club/${query.club}`)
      } else {
        resp.json().then(data => {
          this.setState({
            invite: null,
            error: data,
          })
        })
      }
    })
  }

  render() {
    const { club } = this.props
    const { invite, error, isPublic } = this.state

    if (!invite || !invite.id || !club.code) {
      if (error || club.detail === 'Not found.') {
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
              If you believe that this is an error, please contact{' '}
              <a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a>.
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
    const { name: member, email } = invite
    return (
      <div style={{ padding: '30px 50px' }} className="has-text-centered">
        {/* &#x1F389; is the confetti emoji. */}
        <h2 className="title is-2">
          &#x1F389; Invitation for {name} &#x1F389;
        </h2>
        <div className="title is-4" style={{ fontWeight: 'normal' }}>
          <b>{member}</b> has invited you, <b>{email}</b>, to join{' '}
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
              onChange={() => this.setState({ isPublic: !isPublic })}
            />{' '}
            Make my membership to this club public. Outsiders will be able to
            see my name and role in {name}.
          </label>
        </p>
        <br />
        <button
          className="button is-large is-success"
          onClick={() => this.accept(isPublic)}
        >
          Accept Invitation
        </button>
      </div>
    )
  }
}

Invite.getInitialProps = async ({ query }) => {
  const clubRequest = await doApiRequest(`/clubs/${query.club}/?format=json`)
  const clubResponse = await clubRequest.json()

  return { query, club: clubResponse }
}

export default withRouter(renderPage(Invite))
