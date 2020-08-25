import { NextPageContext } from 'next'
import React, { Component, ReactElement } from 'react'
import s from 'styled-components'

import { Loading } from './components/common'
import { AuthCheckContext } from './components/contexts'
import Footer from './components/Footer'
import Header from './components/Header'
import LoginModal from './components/LoginModal'
import { WHITE } from './constants/colors'
import { NAV_HEIGHT } from './constants/measurements'
import { BODY_FONT } from './constants/styles'
import { Club, ExtendedUserInfo, Tag, UserInfo } from './types'
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
        userInfo: props.userInfo,
      }

      this.checkAuth = this.checkAuth.bind(this)
      this.checkRedirect = this.checkRedirect.bind(this)
      this.closeModal = this.closeModal.bind(this)
      this.openModal = this.openModal.bind(this)
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
        const { props, state, closeModal } = this
        const { modal } = state
        const { authenticated, userInfo } = props
        return (
          <AuthCheckContext.Provider value={this.checkAuth}>
            <RenderPageWrapper>
              <LoginModal show={modal} closeModal={closeModal} />
              <Header authenticated={authenticated} userInfo={userInfo} />
              <Wrapper>
                <Page {...props} {...state} />
              </Wrapper>
              <Footer />
            </RenderPageWrapper>
          </AuthCheckContext.Provider>
        )
      } catch (ex) {
        logException(ex)
      }
    }

    /**
     * Higher order function to wrap operations which require auth.
     * Usage: console.log("Hello World") becomes checkAuth(console.log, "Hello World")
     * This function returns null when no user is found, which may be useful.
     * Passed to child components using the AuthCheckContext.
     */
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
              },
              this.checkRedirect,
            )
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

    const fetchSettings = async () => {
      try {
        const resp = await doApiRequest('/settings/?format=json', {
          headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
        })
        return resp
      } catch (e) {
        return { ok: false, json: () => null }
      }
    }

    const [res, pageProps] = await Promise.all([
      fetchSettings(),
      originalPageProps(),
    ])

    const auth = { authenticated: false, userInfo: undefined }
    if (res.ok) {
      auth.userInfo = await res.json()
      auth.authenticated = true
    }
    return { ...pageProps, ...auth }
  }

  return RenderPage
}

export type PaginatedClubPage = {
  results: Club[]
  count: number
  next: string
}

type ListPageProps = {
  clubs: PaginatedClubPage
  tags: Tag[]
  authenticated: boolean | null
  userInfo: UserInfo
}

export function renderListPage(Page) {
  class RenderListPage extends Component<ListPageProps> {
    static getInitialProps: (
      ctx: NextPageContext,
    ) => Promise<{ tags: Tag[]; clubs: PaginatedClubPage }>

    render(): ReactElement {
      const { clubs, tags, authenticated, userInfo } = this.props

      if (authenticated === null) {
        return <Loading />
      }

      return <Page clubs={clubs} tags={tags} userInfo={userInfo} />
    }
  }

  RenderListPage.getInitialProps = async ({ req }) => {
    const data = {
      headers: req ? { cookie: req.headers.cookie } : undefined,
    }

    const [clubsRequest, tagsRequest] = await Promise.all([
      doApiRequest('/clubs/?page=1&ordering=featured&format=json', data),
      doApiRequest('/tags/?format=json', data),
    ])

    const clubsResponse = await clubsRequest.json()
    const tagsResponse = await tagsRequest.json()

    return {
      tags: tagsResponse,
      clubs: clubsResponse,
    }
  }

  return renderPage(RenderListPage)
}

export default renderPage
