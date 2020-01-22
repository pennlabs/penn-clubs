import { Component } from 'react'
import s from 'styled-components'

import Header from './components/Header'
import Footer from './components/Footer'
import LoginModal from './components/LoginModal'
import { Loading } from './components/common'

import { WHITE } from './constants/colors'
import { doApiRequest } from './utils'
import { logEvent } from './utils/analytics'
import { logException } from './utils/sentry'
import { NAV_HEIGHT } from './constants/measurements'
import { BODY_FONT } from './constants/styles'

const Wrapper = s.div`
  min-height: calc(100vh - ${NAV_HEIGHT});
  font-family: ${BODY_FONT};
`

function renderPage(Page) {
  class RenderPage extends Component {
    constructor(props) {
      super(props)

      this.state = {
        modal: false,
        authenticated: null,
        userInfo: null,
        favorites: [],
        subscriptions: [],
        clubs: null,
      }

      this.openModal = this.openModal.bind(this)
      this.closeModal = this.closeModal.bind(this)
      this.checkAuth = this.checkAuth.bind(this)
      this._updateFavorites = this._updateFavorites.bind(this)
      this._updateSubscriptions = this._updateSubscriptions.bind(this)
      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateSubscriptions = this.updateSubscriptions.bind(this)
      this.updateUserInfo = this.updateUserInfo.bind(this)
    }

    componentDidMount() {
      doApiRequest('/clubs/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ clubs: data }))

      this.updateUserInfo()
    }

    render() {
      try {
        const { props, state, closeModal, updateFavorites, updateUserInfo, updateSubscriptions } = this
        const { authenticated, modal, userInfo } = state
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: WHITE,
            }}
          >
            <LoginModal show={modal} closeModal={closeModal}/>
            <Header
              authenticated={authenticated}
              userInfo={userInfo}
            />
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
          </div>
        )
      } catch (ex) {
        logException(ex)
      }
    }

    checkAuth(func, ...args) {
      if (this.state.authenticated) {
        return func && func(...args)
      } else {
        this.openModal()
        return false
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

    updateUserInfo() {
      doApiRequest('/settings/?format=json').then(resp => {
        if (resp.ok) {
          resp.json().then(userInfo => {
            // redirect to welcome page if user hasn't seen it before
            if (userInfo.has_been_prompted === false && window.location.pathname !== '/welcome') {
              window.location.href = '/welcome?next=' + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash)
            }

            this.setState({
              authenticated: true,
              favorites: userInfo.favorite_set.map(a => a.club),
              subscriptions: userInfo.subscribe_set.map(a => a.club),
              userInfo,
            })
          })
        } else {
          this.setState({
            authenticated: false,
            favorites: [],
            subscriptions: [],
          })
        }
      })
    }
  }

  if (Page.getInitialProps) {
    RenderPage.getInitialProps = async info => {
      return Page.getInitialProps(info)
    }
  }

  return RenderPage
}

export function renderListPage(Page) {
  class RenderListPage extends Component {
    render() {
      const { clubs, tags, favorites, authenticated, userInfo, updateUserInfo, updateFavorites } = this.props

      if (!clubs || authenticated === null) {
        return <Loading />
      }

      return (
        <Page
          clubs={clubs}
          tags={tags}
          favorites={favorites}
          updateFavorites={updateFavorites}
          userInfo={userInfo}
          updateUserInfo={updateUserInfo}
        />
      )
    }
  }

  RenderListPage.getInitialProps = async () => {
    const tagsRequest = await doApiRequest('/tags/?format=json')
    const tagsResponse = await tagsRequest.json()

    return { tags: tagsResponse }
  }

  return renderPage(RenderListPage)
}

export default renderPage
