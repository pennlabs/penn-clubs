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
      }

      this.updateFavorites = this.updateFavorites.bind(this)
      this.updateUserInfo = this.updateUserInfo.bind(this)
    }

    componentDidMount() {
      this.updateUserInfo()
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

    updateUserInfo() {
      doApiRequest('/clubs/?format=json')
        .then(resp => resp.json())
        .then(data => this.setState({ clubs: data }))
      doApiRequest('/settings/?format=json').then((resp) => {
        if (resp.ok) {
          resp.json().then(data => {
            this.setState({
              authenticated: true,
              favorites: data.favorite_set.map(a => a.club),
              userInfo: data,
            })
          })
        } else {
          this.setState({
            authenticated: false,
            favorites: JSON.parse(localStorage.getItem('favorites')) || [],
          })
        }
      })
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

    render() {
      const { favorites } = this.props
      const { clubs, tags } = this.state

      if (!clubs || !tags) {
        return <Loading />
      }

      return (
        <Page
          clubs={clubs}
          tags={tags}
          favorites={favorites}
          updateFavorites={this.props.updateFavorites}
          updateUserInfo={this.props.updateUserInfo}
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
