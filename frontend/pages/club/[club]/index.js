import s from 'styled-components'

import { useState, useEffect } from 'react'
import renderPage from '../../../renderPage'
import { doApiRequest } from '../../../utils'
import Tabs from '../../../components/ClubPage/Tabs'
import Header from '../../../components/ClubPage/Header'
import {
  DesktopActions,
  MobileActions,
} from '../../../components/ClubPage/Actions'
import InfoBox from '../../../components/ClubPage/InfoBox'
import Testimonials from '../../../components/ClubPage/Testimonials'
import SocialIcons from '../../../components/ClubPage/SocialIcons'
import MemberCard from '../../../components/ClubPage/MemberCard'
import {
  Card,
  StrongText,
  WideContainer,
  Flex,
  Title,
  Text,
  Container,
} from '../../../components/common'

import { mediaMaxWidth, MD } from '../../../constants/measurements'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
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
      <div className="columns">
        <div className="column">
          <Card
            bordered
            style={{
              marginBottom: '1rem',
              background: '#ffffff',
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
          </Card>
          <MobileActions
            club={club}
            userInfo={userInfo}
            favorites={favorites}
            updateFavorites={updateFavorites}
            subscriptions={subscriptions}
            updateSubscriptions={updateSubscriptions}
          />
          <Card bordered style={{ marginBottom: '1rem', background: WHITE }}>
            <Tabs club={club} />
          </Card>
          <StrongText>Members</StrongText>
          <div>
            {club.members.length ? (
              club.members.map((a, i) => <MemberCard a={a} key={i} />)
            ) : (
              <p>
                No club members have linked their accounts on Penn Clubs yet.
                Check back later for a list of club members!
              </p>
            )}
          </div>
        </div>
        <div className="column is-one-third">
          <Card bordered style={{ marginBottom: '1rem' }}>
            <StrongText>Basic Info</StrongText>
            <InfoBox club={club} />
            <br />
            <StrongText>Contact</StrongText>
            <SocialIcons club={club} />
          </Card>
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
