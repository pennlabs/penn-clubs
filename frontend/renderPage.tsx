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
import { Club, ClubEvent, ExtendedUserInfo, Tag, UserInfo } from './types'
import { doApiRequest, isClubFieldShown, OptionsContext } from './utils'
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
  options: { [key: string]: string | number | boolean | null }
}

type RenderPageState = {
  modal: boolean
  userInfo: UserInfo | undefined
}

function renderPage(Page) {
  class RenderPage extends Component<RenderPageProps, RenderPageState> {
    static getInitialProps?: (
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
          <OptionsContext.Provider value={this.props.options}>
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
          </OptionsContext.Provider>
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

    const data = {
      headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined,
    }

    const fetchSettings = async () => {
      try {
        const resp = await doApiRequest('/settings/?format=json', data)
        return resp
      } catch (e) {
        return { ok: false, json: () => null }
      }
    }

    const fetchOptions = async () => {
      try {
        const resp = await doApiRequest('/options/?format=json', data)
        return await resp.json()
      } catch (e) {
        return {}
      }
    }

    const [res, pageProps, options] = await Promise.all([
      fetchSettings(),
      originalPageProps(),
      fetchOptions(),
    ])

    const auth = { authenticated: false, userInfo: undefined }
    if (res.ok) {
      auth.userInfo = await res.json()
      auth.authenticated = true
    }
    return { ...pageProps, ...auth, options }
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
      const { authenticated } = this.props

      if (authenticated === null) {
        return <Loading />
      }

      return <Page {...this.props} />
    }
  }

  RenderListPage.getInitialProps = async ({ req }) => {
    const data = {
      headers: req ? { cookie: req.headers.cookie } : undefined,
    }

    const [
      clubsRequest,
      tagsRequest,
      badgesRequest,
      liveEventRequest,
      schoolRequest,
      yearRequest,
      studentTypesRequest,
    ] = await Promise.all([
      doApiRequest('/clubs/?page=1&ordering=featured&format=json', data),
      doApiRequest('/tags/?format=json', data),
      doApiRequest('/badges/?format=json', data),
      doApiRequest('/events/live/', data),
      doApiRequest('/schools/?format=json', data),
      doApiRequest('/years/?format=json', data),
      isClubFieldShown('student_types')
        ? doApiRequest('/student_types/?format=json', data)
        : Promise.resolve(null),
    ])

    const [
      clubsResponse,
      tagsResponse,
      badgesResponse,
      liveEventResponse,
      schoolResponse,
      yearResponse,
      studentTypesResponse,
    ] = await Promise.all([
      clubsRequest.json(),
      tagsRequest.json(),
      badgesRequest.json(),
      liveEventRequest.json(),
      schoolRequest.json(),
      yearRequest.json(),
      studentTypesRequest != null
        ? studentTypesRequest.json()
        : Promise.resolve([]),
    ])

    return {
      tags: tagsResponse,
      badges: badgesResponse,
      clubs: clubsResponse,
      schools: schoolResponse,
      years: yearResponse,
      student_types: studentTypesResponse,
      liveEventCount: liveEventResponse.length,
    }
  }

  return renderPage(RenderListPage)
}

export default renderPage
