import { useState, useEffect } from 'react'
import s from 'styled-components'

import renderPage from '../../../renderPage.js'
import { doApiRequest, LOGIN_URL } from '../../../utils'
import InfoBox from '../../../components/ClubPage/InfoBox'
import {
  StrongText,
  WideContainer,
  Title,
  Text,
  Container,
  Icon,
  TagGroup,
  SmallText,
} from '../../../components/common'
import Link from 'next/link'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Center = s.div`
  text-align: center;
`

const Margin = s.div`
  margin: 1rem;
`

const ClubHeader = s.div`
  margin-top: 1rem;

  h1 {
    margin-top: 1rem;
  }
`

const Fair = ({ authenticated, query, userInfo, favorites, updateFavorites, subscriptions, updateSubscriptions }) => {
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

  const isFavorite = favorites.includes(club.code)
  const isSubscribe = subscriptions.includes(club.code)

  if (!authenticated) {
    return (
      <WideContainer>
        <Center>
          <ClubHeader>
            <Image src="/static/img/peoplelogo.png" />
            <Title>One last step...</Title>
          </ClubHeader>
          <Margin>
            <Text>To make the most of Penn Clubs features, like bookmarking and subscribing to clubs, please login using your PennKey.</Text>
          </Margin>
          <Margin>
            <a href={`${LOGIN_URL}?next=${window.location.href}`} className="button is-link is-large"><Icon alt="login" name="key" /> Continue to login</a>
          </Margin>
          <SmallText><i>(We're sorry, we hate two-step too.)</i></SmallText>
        </Center>
      </WideContainer>
    )
  }

  return (
    <WideContainer>
      <Center>
        <ClubHeader>
          {image && <Image src={image} />}
          <Title>{club.name}</Title>
        </ClubHeader>
        <hr />
        <div className="columns is-mobile">
          <div className="column">
            <div
              className="button is-link is-large"
              disabled={isFavorite}
              onClick={() => isFavorite || updateFavorites(club.code)}>
              <Icon alt='bookmark' name={isFavorite ? 'check-circle' : 'bookmark'} /> {isFavorite ? 'Bookmarked' : 'Bookmark'}
            </div>
          </div>
          <div className="column">
            <div
              className="button is-danger is-large"
              disabled={isSubscribe}
              onClick={() => isSubscribe || updateSubscriptions(club.code)}>
              <Icon alt='subscribe' name={isSubscribe ? 'check-circle' : 'bell'} /> {isSubscribe ? 'Subscribed' : 'Subscribe'}
            </div>
          </div>
        </div>
        <Text><b>Bookmarking</b> a club will save it to your bookmarked clubs list on Penn Clubs.</Text>
        <Text><b>Subscribing</b> to a club will add your email to the club's mailing list for updates.</Text>
        <hr />
      </Center>
      <StrongText>Basic Info</StrongText>
      <InfoBox club={club} />
      <Center>
        <Margin>
          <TagGroup tags={club.tags} />
        </Margin>
        <Text>{club.description}</Text>
        <Link href="/club/[club]" as={`/club/${club.code}`}>
          <a className="button is-danger is-large">See more details</a>
        </Link>
      </Center>
    </WideContainer>
  )
}

Fair.getInitialProps = async ({ query }) => {
  return { query }
}

export default renderPage(Fair)
