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

const LargeIcon = s(Icon)`
  width: 75px;
  height: 75px;
  padding: 5px;
  margin-right: 10px;
  float: left;
`

const Rank = () => (
  <Container background={SNOW}>
    <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
      Club Recommendation Algorithm
    </Title>
    <StrongText>How are clubs ordered?</StrongText>
    <Text>
      The order that clubs appear on the home page is controlled by several
      criteria. A recommendation algorithm exists to ensure that students receive the
      best experience when browsing for new clubs and that clubs can best
      reach the members that they want to recruit.
    </Text>
    <StrongText>How does the club recommendation algorithm work?</StrongText>
    <Text>
      The reccomendation algorithm uses the following criteria to determine how to
      order the club list. The criteria are as follows:
      {[
        {
          name: 'Matches Target Schools',
          description:
            'Adding target schools will increase the ranking of the club for students in those schools. Clubs that have specified less schools will be ranked higher than clubs that have specified more schools for relevant students. Specifying all of the schools is the same as specifying none of them.',
        },
        {
          name: 'Matches Target Majors',
          description:
            'Adding target majors will increase the ranking of the club for students in those majors. Clubs that have specified less majors will be ranked higher than clubs that have specified more majors for relevant students. Specifying 10 or more majors is the same as specifying no majors.',
        },
        {
          name: 'Matches Target Years',
          description:
            'Adding target years will increase the ranking of the club for students in those years. Clubs that have specified less years will be ranked higher than clubs that have specified more years for relevant students. Specifying all of the years is the same as specifying none of them.',
        },
        {
          name: 'Has Description',
          description:
            'Adding a description will help students learn more about whether or not a club is a good fit for them. Clubs without a description will therefore appear lower in the rankings.',
        },
        {
          name: 'Is Club Active',
          description:
            'Clubs that are marked as inactive will be shifted to the bottom of the list. You can easily reactivate your club if it has been marked as inactive.',
        },
        {
          name: 'Random Factor',
          description:
            'A random factor is applied each time the home page loads in order to ensure that students see new clubs every time they visit the site.',
        },
      ].map(({ name, description }) => (
        <RankItem>
          <LargeIcon name="check-circle-green" alt="check" />
          <b>{name}</b>
          <Text>{description}</Text>
        </RankItem>
      ))}
    </Text>
  </Container>
)

export default renderPage(Rank)
