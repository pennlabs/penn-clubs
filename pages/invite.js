import renderPage from '../renderPage.js'
import { doApiRequest, formatResponse, LOGIN_URL } from '../utils'
import React from 'react'
import { Router, Link } from '../routes'

class Invite extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      invite: null,
      error: null,
      club: null,
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
          name: 'Example Name',
          email: 'Example Email',
        },
      })
    } else {
      doApiRequest(
        `/clubs/${query.club}/invites/${query.invite}/?format=json`
      ).then(resp => {
        resp.json().then(data => {
          if (resp.ok) {
            this.setState({ invite: data })
          } else if (
            resp.status === 403 &&
            data.detail === 'Authentication credentials were not provided.'
          ) {
            window.location.href = `${LOGIN_URL}?next=${window.location.href}`
          } else {
            this.setState({ error: data })
          }
        })
      })
    }
    doApiRequest(`/clubs/${query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => {
        this.setState({ club: data })
      })
  }

  accept(isPublic) {
    const { query } = this.props
    doApiRequest(`/clubs/${query.club}/invites/${query.invite}/?format=json`, {
      method: 'PATCH',
      body: {
        token: query.token,
        public: isPublic,
      },
    }).then(resp => {
      if (resp.ok) {
        Router.pushRoute('club-view', { club: query.club })
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
    const { invite, error, club } = this.state

    if (!invite || !invite.id || !club) {
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

    return (
      <div style={{ padding: '30px 50px' }} className="has-text-centered">
        <h2 className="title is-2">&#x1F389; Invitation for {club.name} &#x1F389;</h2>
        <div className="title is-4" style={{ fontWeight: 'normal' }}>
          <b>{invite.name}</b> has invited you, <b>{invite.email}</b>, to join <Link route="club-view" params={{ club: club.code }}>{club.name}</Link>.
        </div>
        {club.image_url && <img src={club.image_url} alt={club.name} style={{ maxHeight: 100, marginBottom: 15 }} />}
        <p style={{ marginBottom: 15 }}>
          By accepting this invitation, you will be able to view the contact
          information of other members and internal club documents.
        </p>
        <p>
          <label>
            <input type="checkbox" checked={this.state.isPublic} onChange={() => this.setState({ isPublic: !this.state.isPublic })} />
            {' '} Make my membership to this club public. Outsiders will be able to see my name and role in {club.name}.
          </label>
        </p>
        <br />
        <button className="button is-large is-success" onClick={() => this.accept(this.state.isPublic)}>
          Accept Invitation
        </button>
      </div>
    )
  }
}

Invite.getInitialProps = async props => {
  return { query: props.query }
}

export default renderPage(Invite)
