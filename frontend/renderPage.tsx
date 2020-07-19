import { NextPageContext } from 'next'
import React, { Component } from 'react'
import s from 'styled-components'

import { Loading } from './components/common'
import { AuthCheckContext } from './components/contexts'
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

const RenderPageWrapper = s.div`
  display: flex;
  flex-direction: column;
  background-color: ${WHITE};
  font-family: ${BODY_FONT};
`

type RenderPageProps = {
  authenticated: boolean | null
  userInfo?: UserInfo
}

type RenderPageState = {
  modal: boolean
  userInfo: UserInfo | undefined
  favorites: string[]
  subscriptions: string[]
}

function renderPage(Page) {
  class RenderPage extends Component<RenderPageProps, RenderPageState> {
    static getInitialProps: (
      ctx: NextPageContext,
    ) => Promise<{ authenticated: boolean; userInfo: undefined }>

    constructor(props: RenderPageProps) {
      super(props)

      this.state = {
        modal: false,
        favorites: [],
        subscriptions: [],
        userInfo: props.userInfo,
      }

      this._updateFavorites = this._updateFavorites.bind(this)
      this._updateSubscriptions = this._updateSubscriptions.bind(this)
      this.checkAuth = this.checkAuth.bind(this)
      this.checkRedirect = this.checkRedirect.bind(this)
      this.closeModal = this.closeModal.bind(this)
      this.openModal = this.openModal.bind(this)
      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateSubscriptions = this.updateSubscriptions.bind(this)
      this.updateUserInfo = this.updateUserInfo.bind(this)
    }

    componentDidMount() {
      if (this.props.authenticated === null) {
        this.updateUserInfo()
      } else {
        this.checkRedirect()
      }
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
        } = this
        const { modal } = state
        const { authenticated, userInfo } = props
        return (
          <AuthCheckContext.Provider value={this.checkAuth}>
            <RenderPageWrapper>
              <LoginModal show={modal} closeModal={closeModal} />
              <Header authenticated={authenticated} userInfo={userInfo} />
              <Wrapper>
                <Page
                  {...props}
                  {...state}
                  updateFavorites={updateFavorites}
                  updateSubscriptions={updateSubscriptions}
                  updateUserInfo={updateUserInfo}
                />
              </Wrapper>
              <Footer />
            </RenderPageWrapper>
          </AuthCheckContext.Provider>
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
        doApiRequest('/subscribe/?format=json', {
          method: 'POST',
          body: {
            club: id,
          },
        })
      } else {
        newSubs.splice(i, 1)
        logEvent('unsubscribe', id)
        doApiRequest(`/subscribe/${id}/?format=json`, {
          method: 'DELETE',
        })
      }
      this.setState({ subscriptions: newSubs })
      return i === -1
    }

    checkRedirect(): void {
      const { userInfo } = this.state

      // redirect to welcome page if user hasn't seen it before
      if (
        typeof window !== 'undefined' &&
        userInfo &&
        userInfo.has_been_prompted === false &&
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
    }

    updateUserInfo(): void {
      doApiRequest('/settings/?format=json').then((resp) => {
        if (resp.ok) {
          resp.json().then((userInfo) => {
            this.setState(
              {
                userInfo: userInfo,
                favorites: userInfo.favorite_set.map((a) => a.club),
                subscriptions: userInfo.subscribe_set.map((a) => a.club),
              },
              this.checkRedirect,
            )
          })
        } else {
          this.setState({
            favorites: [],
            subscriptions: [],
          })
        }
      })
    }
  }

  RenderPage.getInitialProps = async (ctx: NextPageContext) => {
    const originalPageProps = async () => {
      let pageProps = {}
      if (Page.getInitialProps) {
        pageProps = await Page.getInitialProps(ctx)
      }
      return pageProps
    }

    const [res, pageProps] = await Promise.all([
      doApiRequest('/settings/?format=json', {
        headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
      }),
      originalPageProps(),
    ])

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
  authenticated: boolean | null
  userInfo: UserInfo
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
    }

    render(): JSX.Element {
      const { clubs, clubCount, tags, authenticated, userInfo } = this.props

      if (authenticated === null) {
        return <Loading />
      }

      return (
        <Page
          clubs={clubs}
          clubCount={clubCount}
          tags={tags}
          userInfo={userInfo}
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

    const tagsRequest = await doApiRequest('/tags/?format=json', data)
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
