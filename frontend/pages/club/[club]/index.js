import s from 'styled-components'
import { useRouter } from 'next/router'

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
import QuestionList from '../../../components/ClubPage/QuestionList'
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
  club,
  clubCode,
  userInfo,
  favorites,
  updateFavorites,
  subscriptions,
  updateSubscriptions,
}) => {
  const router = useRouter()
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
      {club.approved || (
        <div className="notification is-warning">
          <Text>
            {club.approved === false ? (
              <span>
                This club has been marked as <b>rejected</b> and is only visible
                to administrators of Penn Clubs.
              </span>
            ) : (
              <span>
                This club has <b>not been approved yet</b> and is only visible
                to administrators of Penn Clubs.
              </span>
            )}
          </Text>
          <div className="buttons">
            <button
              className="button is-success"
              onClick={() => {
                doApiRequest(`/clubs/${clubCode}/?format=json`, {
                  method: 'PATCH',
                  body: {
                    approved: true,
                  },
                })
                  .then(resp => resp.json())
                  .then(() => router.reload())
              }}
            >
              Approve
            </button>
            {club.approved !== false && (
              <button
                className="button is-danger"
                onClick={() => {
                  doApiRequest(`/clubs/${clubCode}/?format=json`, {
                    method: 'PATCH',
                    body: {
                      approved: false,
                    },
                  })
                    .then(resp => resp.json())
                    .then(() => router.reload())
                }}
              >
                Reject
              </button>
            )}
          </div>
        </div>
      )}
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
          <StrongText>FAQ</StrongText>
          <QuestionList club={club} />
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
            <StyledCard bordered>
              <StrongText>How To Get Involved</StrongText>
              <Text style={{ marginBottom: M0 }}>
                {' '}
                {club.how_to_get_involved}{' '}
              </Text>
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

Club.getInitialProps = async ctx => {
  const { query, req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const resp = await doApiRequest(`/clubs/${query.club}/?format=json`, data)
  const club = await resp.json()
  return { club, clubCode: query.club }
}

export default renderPage(Club)
