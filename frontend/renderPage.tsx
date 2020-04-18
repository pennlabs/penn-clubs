import { NextPageContext } from 'next'
import { Component } from 'react'
import s from 'styled-components'

import { Loading } from './components/common'
import Footer from './components/Footer'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import { WHITE } from './constants/colors'
import { NAV_HEIGHT } from './constants/measurements'
import { BODY_FONT } from './constants/styles'
import { Club, Tag, UserInfo } from './types'
import { doApiRequest } from './utils'
import { logEvent } from './utils/analytics'
import { logException } from './utils/sentry'

const Wrapper = s.div`
  min-height: calc(100vh - ${NAV_HEIGHT});
`

type RenderPageProps = {
  authenticated: boolean | null
  userInfo: UserInfo
}

type RenderPageState = {
  modal: boolean
  favorites: Array<string>
  subscriptions: Array<string>
}

function renderPage(Page) {
  class RenderPage extends Component<RenderPageProps, RenderPageState> {
    static getInitialProps: (
      ctx: NextPageContext,
    ) => Promise<{ authenticated: boolean; userInfo: undefined }>

    constructor(props) {
      super(props)

      this.state = {
        modal: false,
        favorites: [],
        subscriptions: [],
        requests: [],
      }

      this.openModal = this.openModal.bind(this)
      this.closeModal = this.closeModal.bind(this)
      this.checkAuth = this.checkAuth.bind(this)
      this._updateFavorites = this._updateFavorites.bind(this)
      this._updateSubscriptions = this._updateSubscriptions.bind(this)
      this._updateRequests = this._updateRequests.bind(this)
      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateSubscriptions = this.updateSubscriptions.bind(this)
      this.updateRequests = this.updateRequests.bind(this)
      this.updateUserInfo = this.updateUserInfo.bind(this)
    }

    componentDidMount() {
      this.updateUserInfo()
    }

    render() {
      try {
        const {
          props,
          state,
          closeModal,
          updateFavorites,
          updateUserInfo,
          updateSubscriptions,
          updateRequests,
        } = this
        const { modal } = state
        const { authenticated, userInfo } = props
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: WHITE,
              fontFamily: BODY_FONT,
            }}
          >
            <LoginModal show={modal} closeModal={closeModal} />
            <Header authenticated={authenticated} userInfo={userInfo} />
            <Wrapper>
              <Page
                {...props}
                {...state}
                updateFavorites={updateFavorites}
                updateSubscriptions={updateSubscriptions}
                updateRequests={updateRequests}
                updateUserInfo={updateUserInfo}
              />
            </Wrapper>
            <Footer />
          </div>
        )
      } catch (ex) {
        logException(ex)
      }
    }

    // Higher order function to wrap operations which require auth.
    // Usage: console.log("Hello World") becomes checkAuth(console.log, "Hello World")
    // This function returns null when no user is found, which may be useful.
    checkAuth(func, ...args) {
      if (this.props.authenticated) {
        return typeof func === 'function' && func(...args)
      } else {
        this.openModal()
        return null
      }
    }

    openModal() {
      this.setState({ modal: true })
    }

    closeModal() {
      this.setState({ modal: false })
    }

    updateFavorites(id) {
      return this.checkAuth(this._updateFavorites, id)
    }

    _updateFavorites(id) {
      const { favorites: newFavs } = this.state
      const i = newFavs.indexOf(id)
      if (i === -1) {
        newFavs.push(id)
        logEvent('favorite', id)
        doApiRequest('/favorites/?format=json', {
          method: 'POST',
          body: { club: id },
        })
      } else {
        newFavs.splice(i, 1)
        logEvent('unfavorite', id)
        doApiRequest(`/favorites/${id}/?format=json`, {
          method: 'DELETE',
        })
      }
      this.setState({ favorites: newFavs })
      return i === -1
    }

    updateSubscriptions(id) {
      return this.checkAuth(this._updateSubscriptions, id)
    }

    _updateSubscriptions(id) {
      const { subscriptions: newSubs } = this.state
      const i = newSubs.indexOf(id)
      if (i === -1) {
        newSubs.push(id)
        logEvent('subscribe', id)
        doApiRequest('/subscribes/?format=json', {
          method: 'POST',
          body: {
            club: id,
          },
        })
      } else {
        newSubs.splice(i, 1)
        logEvent('unsubscribe', id)
        doApiRequest(`/subscribes/${id}/?format=json`, {
          method: 'DELETE',
        })
      }
      this.setState({ subscriptions: newSubs })
      return i === -1
    }

    updateRequests(id) {
      return this.checkAuth(this._updateRequests, id)
    }

    _updateRequests(id) {
      const { requests: newReqs } = this.state
      const i = newReqs.indexOf(id)
      if (i === -1) {
        newReqs.push(id)
        logEvent('request', id)
        doApiRequest('/requests/?format=json', {
          method: 'POST',
          body: {
            club: id,
          },
        })
      } else {
        newReqs.splice(i, 1)
        logEvent('unsubscribe', id)
        doApiRequest(`/requests/${id}/?format=json`, {
          method: 'DELETE',
        })
      }
      this.setState({ requests: newReqs })
      return i === -1
    }

    updateUserInfo() {
      doApiRequest('/settings/?format=json').then((resp) => {
        if (resp.ok) {
          resp.json().then((userInfo) => {
            // redirect to welcome page if user hasn't seen it before
            if (
              window &&
              hasBeenPrompted === false &&
              window.location.pathname !== '/welcome'
            ) {
              window.location.href =
                '/welcome?next=' +
                encodeURIComponent(
                  window.location.pathname +
                    window.location.search +
                    window.location.hash,
                )
            }

            this.setState({
              favorites: userInfo.favorite_set.map((a) => a.club),
              subscriptions: userInfo.subscribe_set.map((a) => a.club),
            })
          })
        } else {
          this.setState({
            favorites: [],
            subscriptions: [],
            requests: [],
          })
        }
      })
    }
  }

  RenderPage.getInitialProps = async (ctx: NextPageContext) => {
    let pageProps = {}
    if (Page.getInitialProps) {
      pageProps = await Page.getInitialProps(ctx)
    }
    const res = await doApiRequest('/settings/?format=json', {
      headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
    })
    const auth = { authenticated: false, userInfo: undefined }
    if (res.ok) {
      auth.userInfo = await res.json()
      auth.authenticated = true
    }
    return { ...auth, ...pageProps }
  }

  return RenderPage
}

type ListPageProps = {
  clubs: [Club]
  tags: [Tag]
  clubCount: number
  favorites: [string]
  authenticated: boolean | null
  userInfo: UserInfo
  updateUserInfo: () => void
  updateFavorites: (code: string) => void
}

type ListPageState = {
  clubs: Array<Club>
}

export function renderListPage(Page) {
  class RenderListPage extends Component<ListPageProps, ListPageState> {
    static getInitialProps: (
      ctx: NextPageContext,
    ) => Promise<{ tags: [Tag]; clubs: [Club]; clubCount: number }>

    constructor(props) {
      super(props)

      this.state = {
        clubs: this.props.clubs,
      }

      this._updateFavorites = this._updateFavorites.bind(this)
    }

    /*
     * An inefficient shim to account for the new "is_favorite" field in clubs.
     * When updateFavorites is called, this field should also be kept in sync.
     * In the future, the "clubs" prop should be the source of truth and the
     * "favorites" prop should not exist anymore.
     */
    _updateFavorites(code: string): void {
      const clubsCopy = this.state.clubs.slice()
      const clubIndex = clubsCopy.findIndex((club) => club.code === code)
      clubsCopy[clubIndex].is_favorite = !clubsCopy[clubIndex].is_favorite
      this.setState({ clubs: clubsCopy })
      this.props.updateFavorites(code)
    }

    render(): JSX.Element {
      const {
        clubs,
        clubCount,
        tags,
        favorites,
        authenticated,
        userInfo,
        updateUserInfo,
      } = this.props

      if (authenticated === null) {
        return <Loading delay={200} />
      }

      return (
        <Page
          clubs={clubs}
          clubCount={clubCount}
          tags={tags}
          favorites={favorites}
          updateFavorites={this._updateFavorites}
          userInfo={userInfo}
          updateUserInfo={updateUserInfo}
        />
      )
    }
  }

  RenderListPage.getInitialProps = async ({ req }) => {
    const data = {
      headers: req ? { cookie: req.headers.cookie } : undefined,
    }
    const clubsRequest = await doApiRequest('/clubs/?page=1&format=json', data)
    const clubsResponse = await clubsRequest.json()

    const tagsRequest = await doApiRequest('/tags/?format=json')
    const tagsResponse = await tagsRequest.json()

    return {
      tags: tagsResponse,
      clubs: clubsResponse.results,
      clubCount: clubsResponse.count,
    }
  }

  return renderPage(RenderListPage)
}

export default renderPage
