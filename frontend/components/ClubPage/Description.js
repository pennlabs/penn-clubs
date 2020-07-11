import s from 'styled-components'

import { EMPTY_DESCRIPTION } from '../../utils'
import { StrongText } from '../common'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

export default ({ club }) => (
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
