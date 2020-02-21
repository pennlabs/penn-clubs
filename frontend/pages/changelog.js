import PropTypes from 'prop-types'
import Link from 'next/link'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import {
  Container,
  Card,
  Line,
  Title,
  StrongText,
  Text,
  Metadata,
} from '../components/common'
import { M0, M2 } from '../constants/measurements.js'
import { WHITE, SNOW } from '../constants/colors.js'

const StyledCard = s(Card)`
  background: ${WHITE};
  margin-bottom: ${M2};
  padding-bottom: ${M0};
`



const LogItem = ({ title, children }) => (
  <StyledCard bordered>
    <StrongText style={{ marginBottom: '0.5rem' }}>{title}</StrongText>
    <Text>
      {children}
    </Text>
  </StyledCard>
)

const changelogItems = [
  {
    "title": "change test 1",
    "description": "adsliflsdfnsdf",
    "tags": "Bug fix",
    "date": "2/7/2020",
  },
  {
    "title": "change test 2",
    "description": "asdlfsldfsdf",
    "tags": "Feature",
    "date": "2/2/2020",
  },
]

const FAQ = () => (
  <Container background={SNOW}>
    <Metadata title="Changelog" />
    <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
      Changelog
    </Title>
    <Text>
      We're constantly improving the Penn Clubs experience. If you’re curious about what’s new in Penn Clubs—and what’s changed—you’re in the right place.
    </Text>
    
    {changelogItems.map(a => (
      <StyledCard bordered>
        <StrongText style={{ marginBottom: '0.5rem' }}>{a.title}</StrongText>
        <Text>
          {a.description}
        </Text>
      </StyledCard>
    ))}
  </Container>
)

export default renderPage(FAQ)
