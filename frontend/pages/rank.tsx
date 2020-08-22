import { ReactElement } from 'react'
import s from 'styled-components'

import {
  Container,
  Icon,
  Metadata,
  StrongText,
  Text,
  Title,
} from '../components/common'
import { GREEN, SNOW } from '../constants/colors'
import renderPage from '../renderPage'

const RankItem = s.div`
  padding: 0.75em;
  margin-top: 15px;

  & p {
    margin-bottom: 0;
  }
`

const LargeIconWrapper = s.div`
  float: left;
  margin-right: 10px;
`

const LargeIcon = s(Icon)`
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

const RankList = ({ items }): ReactElement => {
  return (
    <div className="is-clearfix mb-5">
      {items.map(({ name, description }) => (
        <RankItem key={name}>
          <LargeIconWrapper>
            <LargeIcon
              name="check-circle"
              alt="check"
              style={{ color: GREEN }}
            />
          </LargeIconWrapper>
          <b>{name}</b>
          <Text>{description}</Text>
        </RankItem>
      ))}
    </div>
  )
}

const Rank = (): ReactElement => (
  <Container background={SNOW}>
    <Metadata title="Club Ordering" />
    <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
      Club Recommendation Algorithm
    </Title>
    <StrongText>How are clubs ordered?</StrongText>
    <Text>
      The order that clubs appear on the home page for the default ordering
      method is determined by several criteria. A recommendation algorithm uses
      these criteria to ensure that students receive the best experience when
      browsing for new clubs and that clubs can effectively reach their target
      demographic.
    </Text>
    <StrongText>How does the club recommendation algorithm work?</StrongText>
    <Text>
      The recommendation algorithm uses the following non-targeted criteria to
      determine how to order clubs on the home page. The criteria are:
    </Text>
    <RankList
      items={[
        {
          name: 'Upcoming Events',
          description:
            'If your club has upcoming events registered on Penn Clubs, it will be prioritized on the home page a short period before and during the event.',
        },
        {
          name: 'Membership',
          description:
            'Having your officers and club members displayed on Penn Clubs provides more points of contact for questions about your club.',
        },
        {
          name: 'Has Logo',
          description:
            'Adding a logo to your club can make your club more recognizable. The logo is shown on the homepage before the user clicks on your club.',
        },
        {
          name: 'Has Subtitle',
          description:
            'Adding a subtitle is a quick change that can give students more information about your club without having to visit your club page. The subtitle is shown on the homepage before the user clicks on your club.',
        },
        {
          name: 'Has Description',
          description:
            'Adding a description helps students learn more about whether or not a club is a good fit for them. Clubs without a description will therefore appear lower on the homepage. Longer and more detailed descriptions are awarded bonus points.',
        },
        {
          name: 'Is Club Active',
          description:
            'Clubs that are marked as inactive will be shifted to the very bottom of the list. You can easily renew your club from the settings tab in the manage club page.',
        },
        {
          name: 'Random Factor',
          description:
            'A random factor is applied periodically in order to ensure that students see new clubs every time they visit the site.',
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
          description:
            'Adding tags will case the club to appear higher on the home page for students who are interested in those tags. Clubs that have specified fewer tags are more likely to appear higher than clubs that have specified more tags, for relevant students.',
        },
        {
          name: 'Matches Target Schools',
          description:
            'Adding target schools will cause the club to appear higher on the home page for students in those schools. Clubs that have specified fewer schools are more likely to appear higher than clubs that have specified more schools, for relevant students. Specifying all of the schools is the same as specifying none of them.',
        },
        {
          name: 'Matches Target Majors',
          description:
            'Adding target majors will cause the club to appear higher on the home page for students in those majors. Clubs that have specified fewer majors are more likely to appear higher than clubs that have specified more majors, for relevant students. Specifying 10 or more majors is the same as specifying no majors.',
        },
        {
          name: 'Matches Target Years',
          description:
            'Adding target years will cause the club to appear higher on the home page for students in those years. Clubs that have specified fewer years are more likely to appear higher than clubs that have specified more years, for relevant students. Specifying all of the years is the same as specifying none of them.',
        },
      ]}
    />
  </Container>
)

export default renderPage(Rank)
