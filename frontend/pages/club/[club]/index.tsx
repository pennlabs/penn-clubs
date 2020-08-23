import { NextPageContext } from 'next'
import { ReactElement, useState } from 'react'
import Linkify from 'react-linkify'
import s from 'styled-components'

import ClubMetadata from '../../../components/ClubMetadata'
import {
  DesktopActions,
  MobileActions,
} from '../../../components/ClubPage/Actions'
import ClubApprovalDialog from '../../../components/ClubPage/ClubApprovalDialog'
import Description from '../../../components/ClubPage/Description'
import Events from '../../../components/ClubPage/Events'
import Header from '../../../components/ClubPage/Header'
import InfoBox from '../../../components/ClubPage/InfoBox'
import MemberList from '../../../components/ClubPage/MemberList'
import QuestionList from '../../../components/ClubPage/QuestionList'
import RenewalRequest from '../../../components/ClubPage/RenewalRequest'
import SocialIcons from '../../../components/ClubPage/SocialIcons'
import Testimonials from '../../../components/ClubPage/Testimonials'
import {
  Card,
  Contact,
  Container,
  Flex,
  Icon,
  Metadata,
  StrongText,
  Text,
  Title,
  WideContainer,
} from '../../../components/common'
import { CLUBS_RED, SNOW, WHITE } from '../../../constants/colors'
import { M0, M2, M3 } from '../../../constants/measurements'
import renderPage from '../../../renderPage'
import { Club, QuestionAnswer, UserInfo } from '../../../types'
import { doApiRequest } from '../../../utils'
import { logEvent } from '../../../utils/analytics'

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

const InactiveCard = s(Card)`
  background-color: ${CLUBS_RED};
  margin-bottom: ${M3};
  padding-left: ${M2};
`

type ClubPageProps = {
  club: Club
  userInfo: UserInfo
  questions: QuestionAnswer[]
}

const ClubPage = ({
  club: initialClub,
  questions,
  userInfo,
}: ClubPageProps): ReactElement => {
  const [club, setClub] = useState<Club>(initialClub)

  const updateRequests = (code: string): void => {
    const newClub = Object.assign({}, club)
    logEvent(!newClub.is_request ? 'request' : 'unrequest', code)
    const req = !newClub.is_request
      ? doApiRequest('/requests/?format=json', {
          method: 'POST',
          body: {
            club: code,
          },
        })
      : doApiRequest(`/requests/${code}/?format=json`, {
          method: 'DELETE',
        })

    req.then(() => {
      newClub.is_request = !newClub.is_request
      setClub(newClub)
    })
  }

  const { code } = club
  if (!code) {
    return (
      <Container>
        <Metadata />
        <div className="has-text-centered">
          <Title>404 Not Found</Title>
          <div className="mt-5 mb-5">
            <Image src="/static/img/button.svg" alt="page not found" />
          </div>
          <Text>
            The club you are looking for does not exist. Perhaps the club has
            not been approved yet or the club has been deleted?
          </Text>
          {userInfo === undefined && (
            <Text>
              You are not logged into Penn Clubs. Logging in may allow you to
              view further information.
            </Text>
          )}
          <Text>
            If you believe this is an error, please contact <Contact />.
          </Text>
        </div>
      </Container>
    )
  }

  const { image_url: image } = club

  return (
    <WideContainer background={SNOW} fullHeight>
      <ClubMetadata club={club} />
      <ClubApprovalDialog club={club} userInfo={userInfo} />
      <div className="columns">
        <div className="column">
          {club.active || (
            <InactiveCard
              bordered
              style={{
                paddingLeft: '1rem',
              }}
            >
              <RenewalRequest club={club} />
            </InactiveCard>
          )}

          <StyledCard
            bordered
            style={{
              paddingLeft: '1rem',
            }}
          >
            <Flex>
              {image && <Image src={image} />}
              <Header club={club} style={{ flex: 1 }} />
            </Flex>
          </StyledCard>

          {club.is_ghost && (
            <div className="notification is-info is-light">
              <Icon name="alert-circle" style={{ marginTop: '-3px' }} /> There
              are changes to this club page that are still pending approval from
              the Office of Student Affairs.
            </div>
          )}

          <MobileActions
            club={club}
            userInfo={userInfo}
            updateRequests={updateRequests}
          />
          <StyledCard bordered>
            <Description club={club} />
          </StyledCard>
          <StrongText>Members</StrongText>
          <MemberList club={club} />
          <StrongText>FAQ</StrongText>
          <QuestionList club={club} questions={questions} />
        </div>
        <div className="column is-one-third">
          <DesktopActions
            club={club}
            userInfo={userInfo}
            updateRequests={updateRequests}
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
                <Linkify>{club.how_to_get_involved}</Linkify>
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

ClubPage.getInitialProps = async (
  ctx: NextPageContext,
): Promise<{ club: Club; questions: QuestionAnswer[] }> => {
  const { query, req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [club, questions] = await Promise.all(
    [
      `/clubs/${query.club}/?format=json`,
      `/clubs/${query.club}/questions/?format=json`,
    ].map(async (url) => (await doApiRequest(url, data)).json()),
  )
  return { club, questions }
}

export default renderPage(ClubPage)
