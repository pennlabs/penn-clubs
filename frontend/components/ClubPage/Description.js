import s from 'styled-components'
import { StrongText } from '../common'
import { EMPTY_DESCRIPTION } from '../../utils'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

export default ({ club }) => (
  <Wrapper>
    <div style={{ padding: '1rem' }}>
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
