import ClubMetadata from 'components/ClubMetadata'
import { DesktopActions, MobileActions } from 'components/ClubPage/Actions'
import AdvisorList from 'components/ClubPage/AdvisorList'
import ClubApprovalDialog from 'components/ClubPage/ClubApprovalDialog'
import Description from 'components/ClubPage/Description'
import FilesList from 'components/ClubPage/FilesList'
import Header from 'components/ClubPage/Header'
import InfoBox from 'components/ClubPage/InfoBox'
import MemberList from 'components/ClubPage/MemberList'
import QuestionList from 'components/ClubPage/QuestionList'
import RenewalRequest from 'components/ClubPage/RenewalRequestDialog'
import SocialIcons from 'components/ClubPage/SocialIcons'
import Testimonials from 'components/ClubPage/Testimonials'
import {
  Card,
  Contact,
  Container,
  Flex,
  Icon,
  InfoPageTitle,
  Metadata,
  StrongText,
  Text,
  WideContainer,
} from 'components/common'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useRef, useState } from 'react'
import Linkify from 'react-linkify'
import Select from 'react-select'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { Club, QuestionAnswer, UserInfo, VisitType } from 'types'
import { doApiRequest, isClubFieldShown } from 'utils'
import { logEvent } from 'utils/analytics'
import {
  APPROVAL_AUTHORITY,
  FIELD_PARTICIPATION_LABEL,
  OBJECT_NAME_SINGULAR,
  SHOW_ADDITIONAL_LINKS,
  SHOW_MEMBERS,
  SITE_NAME,
} from 'utils/branding'

import EventCarousel from '~/components/ClubPage/EventCarousel'
import { CLUB_ALUMNI_ROUTE, CLUB_ORG_ROUTE } from '~/constants'
import { CLUBS_RED, SNOW, WHITE } from '~/constants/colors'
import { M0, M2, M3 } from '~/constants/measurements'

const Image = styled.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const StyledCard = styled(Card)`
  background-color: ${WHITE};
  margin-bottom: ${M3};
  padding-left: ${M2};
`

const InactiveCard = styled(Card)`
  background-color: ${CLUBS_RED};
  margin-bottom: ${M3};
  padding-left: ${M2};
`

type ClubPageProps = {
  club: Club
  userInfo?: UserInfo
  questions: QuestionAnswer[]
}

const QAButton = styled.button.attrs({ className: 'button is-primary' })`
  font-size: 0.8em;
  margin-bottom: 1rem;
  padding: 1.5rem;
  width: 100%;
  white-space: pre-wrap;
`

const FAQSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const selectOptions = [
  { value: 'id', label: 'Most Recent' },
  { value: 'likes', label: 'Most Likes' },
]

const selectStyles = {
  control: (provided) => ({
    ...provided,
    width: 175,
  }),
}

const ClubPage = ({
  club: initialClub,
  questions,
  userInfo,
}: ClubPageProps): ReactElement<any> => {
  const [club, setClub] = useState<Club>(initialClub)
  const [questionSortBy, setQuestionSortBy] = useState<string>('id')
  const scrollToRef = (ref) =>
    window.scrollTo({ top: ref.current.offsetTop - 100, behavior: 'smooth' })
  const questionsScrollRef = useRef(null)
  const scrollToQuestions = () => scrollToRef(questionsScrollRef)

  const handleOwnershipRequest = async () => {
    const csrftoken = document.cookie.match(/csrftoken=([^;]+)/)?.[1]
    const res = await fetch('/api/requests/ownership/?format=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken || '',
      },
      credentials: 'include',
      body: JSON.stringify({ club: club.code }),
    })

    if (res.ok) {
      alert('Ownership request submitted!')
    } else {
      const err = await res.json()
      alert(`Error: ${err.detail || 'Something went wrong'}`)
    }
  }

  const updateRequests = async (code: string): Promise<void> => {
    const newClub = { ...club }
    logEvent(!newClub.is_request ? 'request' : 'unrequest', code)
    const req = !newClub.is_request
      ? doApiRequest('/requests/membership/?format=json', {
          method: 'POST',
          body: {
            club: code,
          },
        })
      : doApiRequest(`/requests/membership/${code}/?format=json`, {
          method: 'DELETE',
        })

    await req

    newClub.is_request = !newClub.is_request
    setClub(newClub)
  }

  useEffect(() => {
    doApiRequest('/clubvisits/?format=json', {
      method: 'POST',
      body: {
        club: code,
        visit_type: VisitType.ClubPage,
      },
    })
  }, [])

  const { code } = club
  if (!code) {
    return (
      <Container>
        <Metadata />
        <div className="has-text-centered">
          <InfoPageTitle>404 Not Found</InfoPageTitle>
          <div className="mt-5 mb-5">
            <Image src="/static/img/button.svg" alt="page not found" />
          </div>
          <Text>
            The {OBJECT_NAME_SINGULAR} you are looking for does not exist.
            Perhaps the {OBJECT_NAME_SINGULAR} has not been approved yet or the{' '}
            {OBJECT_NAME_SINGULAR} has been deleted?
          </Text>
          {userInfo === undefined && (
            <Text>
              You are not logged into {SITE_NAME}. Logging in may allow you to
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

  const {
    active: isActive,
    image_url: image,
    how_to_get_involved: involvement,
    events,
    testimonials,
    signature_events: signatureEvents,
  } = club
  return (
    <WideContainer background={SNOW} fullHeight>
      <ClubMetadata club={club} />
      {userInfo != null && (
        <ClubApprovalDialog club={club} userInfo={userInfo} />
      )}
      {club.affiliations &&
        club.affiliations.length > 0 &&
        club.affiliations
          .filter(
            (affiliation) =>
              affiliation.message && affiliation.message.length > 0,
          )
          .map((affiliation) => (
            <div className="notification is-info is-light" key={affiliation.id}>
              <Icon name="alert-circle" style={{ marginTop: '-3px' }} />{' '}
              {affiliation.message}
            </div>
          ))}
      <div className="columns">
        <div className="column is-two-thirds">
          {isActive || (
            <InactiveCard
              $bordered
              style={{
                paddingLeft: '1rem',
              }}
            >
              <RenewalRequest club={club} />
              {!club.is_member && userInfo && (
                <div className="mt-4">
                  <p style={{ color: 'white' }}>
                    If you want to take over this club, click the button below:
                  </p>
                  <button
                    className="button is-warning is-light mt-2"
                    onClick={handleOwnershipRequest}
                  >
                    Request Ownership
                  </button>
                </div>
              )}
            </InactiveCard>
          )}

          <StyledCard
            $bordered
            style={{
              paddingLeft: '1rem',
            }}
          >
            <Flex>
              {image && <Image alt="" src={image} />}
              <Header club={club} style={{ flex: 1 }} />
            </Flex>
          </StyledCard>

          {club.is_ghost && (
            <div className="notification is-info is-light">
              <Icon name="alert-circle" style={{ marginTop: '-3px' }} /> There
              are changes to this {OBJECT_NAME_SINGULAR} page that are still
              pending approval from the {APPROVAL_AUTHORITY}.
            </div>
          )}
          <MobileActions
            club={club}
            authenticated={userInfo !== undefined}
            updateRequests={updateRequests}
          />
          <StyledCard $bordered>
            <Description club={club} />
          </StyledCard>
          {club.advisor_set.length > 0 && (
            <>
              <StrongText>Points of Contact</StrongText>
              <AdvisorList club={club} />
            </>
          )}
          <div className="mb-3">
            <FAQSectionHeader ref={questionsScrollRef}>
              <StrongText>FAQ</StrongText>
              <Select
                instanceId="FAQ-sort"
                options={selectOptions}
                styles={selectStyles}
                onChange={(e: any) => setQuestionSortBy(e.value)}
                value={selectOptions.filter(
                  (option) => option.value === questionSortBy,
                )}
                isSearchable={false}
              />
            </FAQSectionHeader>
            <QuestionList
              club={club}
              questions={questions}
              sortBy={questionSortBy}
            />
          </div>
          {club.is_member !== false && club.files && !!club.files.length && (
            <div className="mt-4">
              <StrongText> Uploaded Files </StrongText>
              <StyledCard $bordered>
                <FilesList club={club} />
              </StyledCard>
            </div>
          )}
          {SHOW_MEMBERS && (
            <>
              <StrongText>Members</StrongText>
              <MemberList club={club} />
            </>
          )}
          {events.length > 0 && <EventCarousel events={events} />}
        </div>
        <div className="column is-one-third">
          <DesktopActions
            club={club}
            authenticated={userInfo !== undefined}
            updateRequests={updateRequests}
          />
          <QAButton onClick={scrollToQuestions}>
            {questions.length > 0
              ? `Click here to see the ${questions.length} question${
                  questions.length === 1 ? '' : 's'
                } asked about this ${OBJECT_NAME_SINGULAR} so far!`
              : `Be the first to ask a question about this ${OBJECT_NAME_SINGULAR}!`}
          </QAButton>
          <StyledCard $bordered>
            <InfoBox club={club} />
            <br />
            <StrongText>Contact</StrongText>
            <SocialIcons club={club} />
          </StyledCard>
          {involvement && !!involvement.length && (
            <StyledCard $bordered>
              <StrongText>{FIELD_PARTICIPATION_LABEL}</StrongText>
              <div dangerouslySetInnerHTML={{ __html: involvement }} />
            </StyledCard>
          )}
          {isClubFieldShown('signature_events') &&
            signatureEvents &&
            !!signatureEvents.length && (
              <StyledCard $bordered>
                <StrongText>Signature Events</StrongText>
                <Text style={{ marginBottom: M0, wordBreak: 'break-word' }}>
                  <Linkify>{signatureEvents}</Linkify>
                </Text>
              </StyledCard>
            )}
          <Testimonials data={testimonials} />
          {SHOW_ADDITIONAL_LINKS && (
            <div className="mb-3">
              <StrongText>Additional Pages</StrongText>
              <ul>
                {userInfo && (
                  <li>
                    <Link
                      legacyBehavior
                      href={CLUB_ALUMNI_ROUTE()}
                      as={CLUB_ALUMNI_ROUTE(club.code)}
                    >
                      <a>
                        <Icon name="database" /> Alumni
                      </a>
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    legacyBehavior
                    href={CLUB_ORG_ROUTE()}
                    as={CLUB_ORG_ROUTE(club.code)}
                  >
                    <a>
                      <Icon name="git-branch" /> Org Tree
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
          )}
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

ClubPage.getAdditionalPermissions = (ctx: NextPageContext): string[] => {
  return [`clubs.manage_club:${ctx.query.club}`]
}

ClubPage.permissions = [
  'clubs.approve_club',
  'clubs.see_fair_status',
  'clubs.delete_club',
]

export default renderPage(ClubPage)
