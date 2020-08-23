import { ReactElement } from 'react'
import s from 'styled-components'

import { Club } from '../../types'
import { EMPTY_DESCRIPTION } from '../../utils'
import { StrongText } from '../common'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;

  & ul, & ol {
    margin-left: 2em;
  }

  & ul {
    list-style-type: disc;
  }
`

type Props = {
  club: Club
}

const Description = ({ club }: Props): ReactElement => (
  <Wrapper>
    <div>
      <StrongText>Description</StrongText>
      <div
        style={{ whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{
          __html: club.description || EMPTY_DESCRIPTION,
        }}
      />
    </div>
  </Wrapper>
)

export default Description
