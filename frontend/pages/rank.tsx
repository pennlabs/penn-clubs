import {
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
  StrongText,
  Text,
} from 'components/common'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import {
  FIELD_PARTICIPATION_LABEL,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SHOW_RANK_ALGORITHM,
  SITE_NAME,
} from 'utils/branding'

import { GREEN, SNOW } from '~/constants/colors'

const RankItem = styled.div`
  padding: 0.75em;
  margin-top: 15px;
  display: flex;

  & p {
    margin-bottom: 0;
  }

  & ul {
    display: block;
    font-size: 0.9em;
    margin-left: 1em;
  }
`

const LargeIconWrapper = styled.div`
  flex-basis: 80px;
  margin-right: 10px;
`

const LargeIcon = styled(Icon)`
  width: 75px;
  height: 75px;
  padding: 5px;

  @media (max-width: 769px) {
    & {
      width: 45px;
      height: 45px;
    }
  }
`

type RankItemData = {
  name: string
  description: string | ReactElement
  points?: [number, string][]
}

type RankListProps = {
  items: RankItemData[]
}

const RankList = ({ items }: RankListProps): ReactElement => {
  return (
    <div className="is-clearfix mb-5">
      {items.map(({ name, description, points }) => (
        <RankItem key={name}>
          <LargeIconWrapper>
            <LargeIcon
              name="check-circle"
              alt="check"
              style={{ color: GREEN }}
            />
          </LargeIconWrapper>
          <div>
            <b>{name}</b>
            <Text>{description}</Text>
            {points && (
              <ul>
                {points.map(([num, desc], i) => (
                  <li key={i}>
                    <b>{num > 0 ? `+${num}` : num}</b>: {desc}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </RankItem>
      ))}
    </div>
  )
}

const Rank = (): ReactElement => (
  <Container background={SNOW}>
    <Metadata title={`${OBJECT_NAME_TITLE_SINGULAR} Ordering`} />
    <InfoPageTitle>
      {OBJECT_NAME_TITLE_SINGULAR} Recommendation Algorithm
    </InfoPageTitle>
    {SHOW_RANK_ALGORITHM || (
      <div className="notification is-info">
        <Icon name="alert-circle" /> The {OBJECT_NAME_SINGULAR} recommendation
        algorithm is not fully configured for {SITE_NAME}. The categories listed
        below may or may not be taken into consideration when ordering{' '}
        {OBJECT_NAME_PLURAL} on the home page.
      </div>
    )}
    <StrongText>How are {OBJECT_NAME_PLURAL} ordered?</StrongText>
    <Text>
      The order that {OBJECT_NAME_PLURAL} appear on the home page for the
      default ordering method is determined by several criteria. A
      recommendation algorithm uses these criteria to ensure that students
      receive the best experience when browsing for new {OBJECT_NAME_PLURAL} and
      that {OBJECT_NAME_PLURAL} can effectively reach their target demographic.
    </Text>
    <StrongText>
      How does the {OBJECT_NAME_SINGULAR} recommendation algorithm work?
    </StrongText>
    <Text>
      The recommendation algorithm uses the following non-targeted criteria to
      determine how to order {OBJECT_NAME_PLURAL} on the home page.{' '}
      {OBJECT_NAME_TITLE} are ordered by points, and then this ordering as
      adjusted based on personalized data. The points obtained from these
      categories is calculated and saved once per day at 4 AM, so make your
      changes early! The criteria are:
    </Text>
    <RankList
      items={[
        {
          name: 'Upcoming Events',
          description: `If your ${OBJECT_NAME_SINGULAR} has upcoming events registered on ${SITE_NAME}, it will be prioritized on the home page a short period before and during the event. Only events shorter than 16 hours are eligible.`,
          points: [
            [10, 'Participating in upcoming activities fair'],
            [10, 'At least one upcoming event is today'],
            [
              10,
              'All upcoming events today have a complete picture and description',
            ],
            [5, 'At least one upcoming event in the next week'],
            [
              5,
              'All upcoming events this week have a complete picture and description',
            ],
          ],
        },
        {
          name: 'Upcoming Applications',
          description: `If a ${OBJECT_NAME_SINGULAR} application is currently open for your ${OBJECT_NAME_SINGULAR}, it will be prioritized while that application is still open.`,
          points: [
            [25, `Has at least one open ${OBJECT_NAME_SINGULAR} application`],
          ],
        },
        {
          name: 'Membership',
          description: `Having your ${OBJECT_NAME_SINGULAR} members displayed on ${SITE_NAME} provides more points of contact for questions about your ${OBJECT_NAME_SINGULAR}.`,
          points: [
            [15, 'At least 3 active officers'],
            [10, 'At least 3 active members'],
            [0.1, 'For every non-officer member'],
          ],
        },
        {
          name: 'Useful Tags',
          description: (
            <>
              Adding relevant tags to your {OBJECT_NAME_SINGULAR} can help
              prospective students find the {OBJECT_NAME_PLURAL} that they are
              interested in. If you cannot find at least 2 relevant tags for
              your {OBJECT_NAME_SINGULAR}, please email <Contact /> and we will
              work with you to find something appropriate.
            </>
          ),
          points: [
            [15, 'Has anywhere between 3 and 7 tags'],
            [7, 'Has more than 7 tags'],
          ],
        },
        {
          name: 'Contact Information',
          description: (
            <>
              Having contact information is important for prospective members
              who want to know more about the {OBJECT_NAME_SINGULAR}. Social
              links can be used to give students a better idea of what you do
              and the events that you hold.
            </>
          ),
          points: [
            [10, 'Has a public email'],
            [10, 'Has 2 or more social links'],
          ],
        },
        {
          name: 'Bookmarks',
          description: (
            <>
              Bookmarks are a method for Penn students to show interest in your
              {OBJECT_NAME_SINGULAR}. The more bookmarks you have, the higher
              your {OBJECT_NAME_SINGULAR} will appear.
            </>
          ),
          points: [[0.04, 'For each bookmark']],
        },
        {
          name: 'Logo Image',
          description: (
            <>
              Adding a logo to your {OBJECT_NAME_SINGULAR} can make your{' '}
              {OBJECT_NAME_SINGULAR} more recognizable. The logo is shown on the
              homepage before the user clicks on your {OBJECT_NAME_SINGULAR}.
            </>
          ),
          points: [[15, 'Has a logo']],
        },
        {
          name: `${OBJECT_NAME_TITLE} Subtitle`,
          description: (
            <>
              Adding a subtitle is a quick change that can give students more
              information about your {OBJECT_NAME_SINGULAR} without having to
              visit your {OBJECT_NAME_SINGULAR}
              page. The subtitle is shown on the homepage before the user clicks
              on your {OBJECT_NAME_SINGULAR}.
            </>
          ),
          points: [
            [5, 'Has a subtitle'],
            [-10, 'Did not change default subtitle'],
          ],
        },
        {
          name: `${OBJECT_NAME_TITLE} Description`,
          description: (
            <>
              Adding a description helps students learn more about whether or
              not a {OBJECT_NAME_SINGULAR} is a good fit for them.{' '}
              {OBJECT_NAME_TITLE} without a description will therefore appear
              lower on the homepage. Longer and more detailed descriptions are
              awarded bonus points.
            </>
          ),
          points: [
            [10, 'At least 25 characters'],
            [10, 'At least 250 characters'],
            [10, 'At least 1000 characters'],
            [3, 'Having images in your description'],
          ],
        },
        {
          name: 'Student Experiences',
          description: (
            <>
              Adding some testimonials help students gain perspective on what
              participating in the {OBJECT_NAME_SINGULAR} is like.
            </>
          ),
          points: [
            [10, 'At least one testimonial'],
            [5, 'At least 3 testimonials'],
          ],
        },
        {
          name: FIELD_PARTICIPATION_LABEL,
          description: `Prospective members want to know how to participate in your ${OBJECT_NAME_SINGULAR}. Omitting this section will result in a large ordering penalty.`,
          points: [[-30, `Empty ${FIELD_PARTICIPATION_LABEL} section`]],
        },
        {
          name: `Is ${OBJECT_NAME_TITLE_SINGULAR} Updated`,
          description: `${OBJECT_NAME_TITLE} that have not been updated in the last 8 months will receive a small ordering penalty.`,
          points: [[-10, 'No updates for 8 months']],
        },
        {
          name: `Is ${OBJECT_NAME_TITLE_SINGULAR} Active`,
          description: (
            <>
              {OBJECT_NAME_TITLE} that are marked as inactive will be shifted to
              the very bottom of the list. You can easily renew your{' '}
              {OBJECT_NAME_SINGULAR} from the settings tab in the manage{' '}
              {OBJECT_NAME_SINGULAR} page.
            </>
          ),
          points: [[-1000, `For inactive ${OBJECT_NAME_PLURAL}`]],
        },
        {
          name: 'Random Factor',
          description: `A random factor is applied periodically in order to ensure that students see new ${OBJECT_NAME_PLURAL} when they visit ${SITE_NAME}.`,
          points: [
            [
              25,
              'Standard exponential random number scaled to average this number, updated daily',
            ],
          ],
        },
      ]}
    />
    <Text>
      The algorithm also attempts to personalize search results for logged in
      users, based on the following criteria:
    </Text>
    <RankList
      items={[
        {
          name: 'Matches Target Tags',
          description: (
            <>
              Adding tags will case the {OBJECT_NAME_SINGULAR} to appear higher
              on the home page for students who are interested in those tags.{' '}
              {OBJECT_NAME_TITLE} that have specified fewer tags are more likely
              to appear higher than {OBJECT_NAME_PLURAL} that have specified
              more tags, for relevant students.
            </>
          ),
        },
        {
          name: 'Matches Target Schools',
          description: (
            <>
              Adding target schools will cause the {OBJECT_NAME_SINGULAR} to
              appear higher on the home page for students in those schools.{' '}
              {OBJECT_NAME_TITLE} that have specified fewer schools are more
              likely to appear higher than {OBJECT_NAME_PLURAL} that have
              specified more schools, for relevant students. Specifying all of
              the schools is the same as specifying none of them.
            </>
          ),
        },
        {
          name: 'Matches Target Majors',
          description: (
            <>
              Adding target majors will cause the {OBJECT_NAME_SINGULAR} to
              appear higher on the home page for students in those majors.{' '}
              {OBJECT_NAME_TITLE} that have specified fewer majors are more
              likely to appear higher than {OBJECT_NAME_PLURAL} that have
              specified more majors, for relevant students. Specifying 10 or
              more majors is the same as specifying no majors.
            </>
          ),
        },
        {
          name: 'Matches Target Years',
          description: (
            <>
              Adding target years will cause the {OBJECT_NAME_SINGULAR} to
              appear higher on the home page for students in those years.{' '}
              {OBJECT_NAME_TITLE}
              that have specified fewer years are more likely to appear higher
              than {OBJECT_NAME_PLURAL} that have specified more years, for
              relevant students. Specifying all of the years is the same as
              specifying none of them.
            </>
          ),
        },
      ]}
    />
  </Container>
)

export default renderPage(Rank)
