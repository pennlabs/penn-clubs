import { useEffect, useState } from 'react'
import s from 'styled-components'

import { CLUBS_NAVY } from '../constants/colors'
import { L1, L2 } from '../constants/measurements'

const Wrapper = s.div`
  width: 18.5rem;
  display:inline-block;
`

const Logo = s.img`
  width: 120px;
`

const TitleText = s.div`
  margin-left:15px;
  text-align: left;
  color: ${CLUBS_NAVY};
  font-size: ${L1};
  line-height: ${L1};
  font-weight: bold;
  display:inline;
  float:right;
`

const SubtitleText = s.div`
  text-align: left;
  color: ${CLUBS_NAVY};
  font-size: ${L2};
  font-style:italic;
  display:inline-block;
`

export default () => {
  const [newlyMounted, setNewlyMounted] = useState(true)
  useEffect(() => {
    newlyMounted && setNewlyMounted(false)
  })
  return (
    <Wrapper>
      <Logo src="/static/img/peoplelogo.png" alt="Penn Clubs Logo" />
      <TitleText>
        Penn
        <br />
        Clubs
      </TitleText>
      <SubtitleText>
        Student Organizations at the University of Pennsylvania
      </SubtitleText>
    </Wrapper>
  )
}
