import s from 'styled-components'

import { useState, useEffect } from 'react'
import renderPage from '../../../renderPage'
import { doApiRequest } from '../../../utils'
import Description from '../../../components/ClubPage/Description'
import Header from '../../../components/ClubPage/Header'
import {
  DesktopActions,
  MobileActions,
} from '../../../components/ClubPage/Actions'
import InfoBox from '../../../components/ClubPage/InfoBox'
import Testimonials from '../../../components/ClubPage/Testimonials'
import Events from '../../../components/ClubPage/Events'
import SocialIcons from '../../../components/ClubPage/SocialIcons'
import MemberList from '../../../components/ClubPage/MemberList'
import {
  Card,
  StrongText,
  WideContainer,
  Flex,
  Title,
  Text,
  Container,
  Metadata,
} from '../../../components/common'
import { SNOW, WHITE } from '../../../constants/colors'
import { M0, M2, M3 } from '../../../constants/measurements'
import ClubMetadata from '../../../components/ClubMetadata'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const StyledCard = s(Card)`
  background-color: ${WHITE};
  margin-bottom: ${M3};
  padding-left: ${M2};
`

const Club = ({
  club: initialClub,
  userInfo,
  favorites,
  updateFavorites,
  subscriptions,
  updateSubscriptions,
}) => {
  const [club, setClub] = useState(initialClub)

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/?format=json`)
      .then(resp => resp.json())
      .then(data => setClub(data))
  }, [initialClub])

  if (!club) return null

  const { code } = club
  if (!code) {
    return (
      <Container>
        <Metadata />
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <Text>The club you are looking for does not exist.</Text>
        </div>
      </Container>
    )
  }

  const { image_url: image } = club

  return (
    <WideContainer background={SNOW} fullHeight>
      <ClubMetadata club={club} />
      <div className="columns">
        <div className="column">
          <StyledCard
            bordered
            style={{
              paddingLeft: '1rem',
            }}
          >
            <Flex>
              {image && <Image src={image} />}
              <Header
                club={club}
                userInfo={userInfo}
                favorites={favorites}
                updateFavorites={updateFavorites}
                subscriptions={subscriptions}
                updateSubscriptions={updateSubscriptions}
                style={{ flex: 1 }}
              />
            </Flex>
          </StyledCard>
          <MobileActions
            club={club}
            userInfo={userInfo}
            favorites={favorites}
            updateFavorites={updateFavorites}
            subscriptions={subscriptions}
            updateSubscriptions={updateSubscriptions}
          />
          <StyledCard bordered>
            <Description club={club} />
          </StyledCard>
          <StrongText>Members</StrongText>
          <MemberList club={club} />
        </div>
        <div className="column is-one-third">
          <DesktopActions
            club={club}
            userInfo={userInfo}
            favorites={favorites}
            updateFavorites={updateFavorites}
            subscriptions={subscriptions}
            updateSubscriptions={updateSubscriptions}
          />
          <StyledCard bordered>
            <StrongText>Basic Info</StrongText>
            <InfoBox club={club} />
            <br />
            <StrongText>Contact</StrongText>
            <SocialIcons club={club} />
          </StyledCard>
          {club.how_to_get_involved ? (
            <StyledCard bordered >
              <StrongText>How To Get Involved</StrongText>
              <Text style={{ marginBottom: M0 }}> {club.how_to_get_involved} </Text>
            </StyledCard>
          ) : (
            <div></div>
          )}
          <Events data={club.events} />
          <Testimonials data={club.testimonials} />
        </div>
      </div>
    </WideContainer>
  )
}

Club.getInitialProps = async props => {
  const { query } = props
  const resp = await doApiRequest(`/clubs/${query.club}/?format=json`)
  const club = await resp.json()
  return { club }
}

export default renderPage(Club)
