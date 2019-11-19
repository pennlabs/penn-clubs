import React from 'react'
import s from 'styled-components'

import Header from './components/Header'
import Footer from './components/Footer'
import { Loading } from './components/common'

import { WHITE } from './constants/colors'
import { doApiRequest } from './utils'
import { logEvent } from './utils/analytics'
import { logException } from './utils/sentry'
import { NAV_HEIGHT } from './constants/measurements'

const Wrapper = s.div`
  min-height: calc(100vh - ${NAV_HEIGHT});
`

function renderPage(Page) {
  class RenderPage extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        authenticated: null,
        userInfo: null,
        favorites: [],
        subscriptions: [],
      }

      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateSubscriptions = this.updateSubscriptions.bind(this)
      this.updateUserInfo = this.componentDidMount.bind(this)
    }

    componentDidMount() {
      doApiRequest('/settings/?format=json').then(resp => {
        if (resp.ok) {
          resp.json().then(data =>
            this.setState({
              authenticated: true,
              favorites: data.favorite_set.map(a => a.club),
              userInfo: data,
            })
          )
        } else {
          this.setState({
            authenticated: false,
            favorites: JSON.parse(localStorage.getItem('favorites')) || [],
            subscriptions: JSON.parse(localStorage.getItem('subscriptions')) || [],
          })
        }
      })
    }

    render() {
      try {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: WHITE,
            }}
          >
            <Header
              authenticated={this.state.authenticated}
              userInfo={this.state.userInfo}
            />
            <Wrapper>
              <Page
                {...this.props}
                {...this.state}
                updateFavorites={this.updateFavorites}
                updateSubscriptions={this.updateSubscriptions}
                updateUserInfo={this.updateUserInfo}
              />
            </Wrapper>
            <Footer />
          </div>
        )
      } catch (ex) {
        logException(ex)
      }
    }

    updateFavorites(id) {
      var newFavs = this.state.favorites
      var i = newFavs.indexOf(id)
      if (i === -1) {
        newFavs.push(id)
        if (this.state.authenticated) {
          logEvent('favorite', id)
          doApiRequest('/favorites/?format=json', {
            method: 'POST',
            body: {
              club: id,
            },
          })
        }
      } else {
        newFavs.splice(i, 1)
        logEvent('unfavorite', id)
        if (this.state.authenticated) {
          doApiRequest(`/favorites/${id}/?format=json`, {
            method: 'DELETE',
          })
        }
      }
      this.setState({ favorites: newFavs })
      if (!this.state.authenticated) {
        localStorage.setItem('favorites', JSON.stringify(newFavs))
      }
      return i === -1
    }

    updateSubscriptions(id) {
      var newSubs = this.state.subscriptions
      var i = newSubs.indexOf(id)
      if (i === -1) {
        newSubs.push(id)
        if (this.state.authenticated) {
          logEvent('subscribe', id)
          doApiRequest('/subscribe/?format=json', {
            method: 'POST',
            body: {
              club: id,
            },
          })
        }
      } else {
        newSubs.splice(i, 1)
        logEvent('unsubscribe', id)
        if (this.state.authenticated) {
          doApiRequest(`/subscribe/${id}/?format=json`, {
            method: 'DELETE',
          })
        }
      }
      this.setState({ subscriptions: newSubs })
      if (!this.state.authenticated) {
        localStorage.setItem('subscriptions', JSON.stringify(newSubs))
      }
      return i === -1
    }
  }

  RenderPage.getInitialProps = async info => {
    if (Page.getInitialProps) {
      return Page.getInitialProps(info)
    }
    return {}
  }

  return RenderPage
}

export function renderListPage(Page) {
  class RenderListPage extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        clubs: props.clubs,
        tags: props.tags,
      }
    }

    componentDidMount() {
      doApiRequest('/clubs/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ clubs: data }))
      doApiRequest('/tags/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ tags: data }))
    }

    mapToClubs(favorites) {
      const { clubs } = this.state
      if (!clubs || !clubs.length) return []

      return favorites.map(favorite => {
        return clubs.find(club => club.code === favorite)
      })
    }

    render() {
      const { favorites, subscriptions } = this.props
      const { clubs, tags } = this.state

      if (!clubs || !tags) {
        return <Loading />
      }

      const favoriteClubs = this.mapToClubs(favorites)
      const subscribedClubs = this.mapToClubs(subscriptions)

      return (
        <Page
          clubs={clubs}
          tags={tags}
          favorites={favorites}
          updateFavorites={this.props.updateFavorites}
          subscriptions={this.props.subscriptions}
          updateSubscriptions={this.props.updateSubscriptions}
          favoriteClubs={favoriteClubs}
          subscribedClubs={subscribedClubs}
        />
      )
    }
  }

  RenderListPage.getInitialProps = async () => {
    return { clubs: null, tags: null }
  }

  return renderPage(RenderListPage)
}

export default renderPage
