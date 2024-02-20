import ClubMetadata from 'components/ClubMetadata'
import InfoBox from 'components/ClubPage/InfoBox'
import {
  Center,
  Container,
  Icon,
  Loading,
  PhoneContainer,
  SmallText,
  TagGroup,
  Text,
  Title,
} from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { AuthCheckContext } from 'components/contexts'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useContext, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Club, VisitType } from 'types'
import {
  apiSetFavoriteStatus,
  apiSetSubscribeStatus,
  doApiRequest,
} from 'utils'
import { OBJECT_NAME_SINGULAR, SITE_NAME } from 'utils/branding'

import { CLUB_ROUTE } from '~/constants/routes'

const Image = styled.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Margin = styled.div`
  margin: 1rem;
`

const ClubHeader = styled.div`
  margin-top: 1rem;

  h1 {
    margin-top: 1rem;
  }
`

type FairProps = {
  authenticated: boolean | null
  club: Club
}

const Fair = ({ authenticated, club }: FairProps): ReactElement | null => {
  if (!club) return null
  if (!club.code) {
    return (
      <Container>
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <Text>
            The {OBJECT_NAME_SINGULAR} you are looking for does not exist.
          </Text>
        </div>
      </Container>
    )
  }

  const { image_url: image } = club

  const [isFavorite, setFavorite] = useState<boolean>(club.is_favorite)
  const [isSubscribe, setSubscribe] = useState<boolean>(club.is_subscribe)
  const authCheck = useContext(AuthCheckContext)

  const updateFavorite = () => {
    authCheck(() => {
      apiSetFavoriteStatus(club.code, true).then(() => setFavorite(true))
    })
  }

  const updateSubscription = () => {
    authCheck(() =>
      apiSetSubscribeStatus(club.code, true).then(() => setSubscribe(true)),
    )
  }

  useEffect(() => {
    if (club != null) {
      doApiRequest('/clubvisits/?format=json', {
        method: 'POST',
        body: {
          club: club.code,
          visit_type: VisitType.FairPage,
        },
      })
    }
  }, [club])

  if (authenticated === null) {
    return <Loading />
  }

  if (authenticated === false) {
    return <AuthPrompt />
  }

  return (
    <PhoneContainer>
      <ClubMetadata club={club} />
      <Center>
        <ClubHeader>
          {image && <Image src={image} />}
          <Title>{club.name}</Title>
        </ClubHeader>
        <hr />
        <div className="columns is-mobile">
          <div className="column">
            <button
              className="button is-link is-large"
              disabled={isFavorite}
              onClick={() => isFavorite || updateFavorite()}
            >
              <Icon
                alt="bookmark"
                name={isFavorite ? 'check-circle' : 'bookmark'}
              />{' '}
              {isFavorite ? 'Bookmarked' : 'Bookmark'}
            </button>
            <Text style={{ marginTop: '0.5rem' }}>To save for later</Text>
          </div>
          <div className="column">
            <button
              className="button is-danger is-large"
              disabled={isSubscribe}
              onClick={() => isSubscribe || updateSubscription()}
            >
              <Icon
                alt="subscribe"
                name={isSubscribe ? 'check-circle' : 'bell'}
              />{' '}
              {isSubscribe ? 'Subscribed' : 'Subscribe'}
            </button>
            <Text style={{ marginTop: '0.5rem' }}>To join mailing list</Text>
          </div>
        </div>
        <SmallText>
          <i>
            Bookmarks and subscriptions can be managed from your {SITE_NAME}{' '}
            account at any time.
          </i>
        </SmallText>
        <hr />
      </Center>
      <InfoBox club={club} />
      <Center>
        <Margin>
          <TagGroup tags={club.tags} />
        </Margin>
        <Text>
          <div dangerouslySetInnerHTML={{ __html: club.description }} />
        </Text>
        <Link legacyBehavior href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
          <a className="button is-danger is-large">See more details</a>
        </Link>
      </Center>
    </PhoneContainer>
  )
}

Fair.getInitialProps = async ({
  req,
  query,
}: NextPageContext): Promise<{ club: Club }> => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const resp = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const club = await resp.json()
  return { club }
}

export default renderPage(Fair)
