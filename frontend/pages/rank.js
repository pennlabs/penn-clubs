import s from 'styled-components'
import renderPage from '../renderPage.js'
import { Container, Title, StrongText, Text, Icon } from '../components/common'
import { SNOW } from '../constants/colors.js'

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
`

const Rank = () => (
  <Container background={SNOW}>
    <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
      Club Recommendation Algorithm
    </Title>
    <StrongText>How are clubs ordered?</StrongText>
    <Text>
      The order that clubs appear on the home page is determined by several
      criteria. A recommendation algorithm uses these criteria to ensure that
      students receive the best experience when browsing for new clubs and that
      clubs can effectively reach their target demographic.
    </Text>
    <StrongText>How does the club recommendation algorithm work?</StrongText>
    <Text>
      The recommendation algorithm uses the following criteria to determine how
      to order clubs on the home page. The criteria are:
    </Text>
    {[
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
      {
        name: 'Has Description',
        description:
          'Adding a description helps students learn more about whether or not a club is a good fit for them. Clubs without a description will therefore appear lower on the homepage.',
      },
      {
        name: 'Is Club Active',
        description:
          'Clubs that are marked as inactive will be shifted to the bottom of the list. You can easily reactivate your club from the "Edit Club" page if it has been marked as inactive.',
      },
      {
        name: 'Random Factor',
        description:
          'A random factor is applied each time the home page loads in order to ensure that students see new clubs every time they visit the site.',
      },
    ].map(({ name, description }) => (
      <RankItem key={name}>
        <LargeIconWrapper>
          <LargeIcon
            name="check-circle"
            alt="check"
            style={{ color: 'green' }}
          />
        </LargeIconWrapper>
        <b>{name}</b>
        <Text>{description}</Text>
      </RankItem>
    ))}
  </Container>
)

export default renderPage(Rank)
