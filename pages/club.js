import { useState, useEffect } from 'react'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import { doApiRequest } from '../utils'
import Tabs from '../components/ClubPage/Tabs'
import Header from '../components/ClubPage/Header'
import InfoBox from '../components/ClubPage/InfoBox'
import SocialIcons from '../components/ClubPage/SocialIcons'
import {
  Card,
  StrongText,
  WideContainer,
  Flex,
  Title,
  Text,
  Container,
} from '../components/common'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Club = ({ query, userInfo, favorites, updateFavorites, updateSubscriptions }) => {
  const [club, setClub] = useState(null)

  useEffect(() => {
    doApiRequest(`/clubs/${query.club}/?format=json`)
      .then(resp => resp.json())
      .then(data => setClub(data))
  }, [query])

  if (!club) return null
  if (!club.code) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <Text>The club you are looking for does not exist.</Text>
        </div>
      </Container>
    )
  }

  const { image_url: image } = club

  return (
    <WideContainer>
      <Flex>
        {image && <Image src={image} />}
        <Header
          club={club}
          userInfo={userInfo}
          favorites={favorites}
          updateFavorites={updateFavorites}
          updateSubscriptions={updateSubscriptions}
          style={{ flex: 1 }}
        />
      </Flex>

      <div className="columns">
        <div className="column">
          <Tabs club={club} />
        </div>
        <div className="column is-one-third">
          <Card bordered style={{ marginBottom: '1rem' }}>
            <StrongText>About</StrongText>
            <InfoBox club={club} />
            <SocialIcons club={club} />
          </Card>
        </div>
      </div>
    </WideContainer>
  )
}

Club.getInitialProps = async props => {
  const { query } = props
  return { query }
}

export default renderPage(Club)
