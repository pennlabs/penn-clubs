import React from 'react'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import { doApiRequest } from '../utils'
import Tabs from '../components/ClubPage/Tabs'
import Header from '../components/ClubPage/Header'
import InfoBox from '../components/ClubPage/InfoBox'
import SocialIcons from '../components/ClubPage/SocialIcons'
import { Card } from '../components/common/Card'
import { WideContainer } from '../components/common/Container'
import { DARK_GRAY } from '../constants/colors'
import { Flex } from '../components/common/Grid'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

class Club extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      club: null,
    }
  }

  componentDidMount() {
    doApiRequest(`/clubs/${this.props.query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => this.setState({ club: data }))
  }

  render() {
    const { club } = this.state

    if (!club) return null

    if (!club.code) {
      return (
        <div className="has-text-centered" style={{ margin: 30 }}>
          <h1 className="title is-h1">
            <strong>404 Not Found</strong>
          </h1>
          <p>The club you are looking for does not exist.</p>
        </div>
      )
    }

    const { image_url: image } = club

    return (
      <WideContainer>
        <Flex>
          {image && <Image src={image} />}
          <Header
            club={club}
            userInfo={this.props.userInfo}
            favorites={this.props.favorites}
            updateFavorites={this.props.updateFavorites}
            style={{ flex: 1 }}
          />
        </Flex>

        <div className="columns">
          <div className="column">
            <Tabs club={club} />
          </div>
          <div className="column is-one-third">
            <Card bordered style={{ marginBottom: '1rem' }}>
              <p style={{ marginBottom: '0.5rem', color: DARK_GRAY }}>
                <strong>About</strong>
              </p>
              <InfoBox club={club} />
              <SocialIcons club={club} />
            </Card>
          </div>
        </div>
      </WideContainer>
    )
  }
}

Club.getInitialProps = async props => {
  var { query } = props
  return { query: query }
}

export default renderPage(Club)
