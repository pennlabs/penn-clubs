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

export default props => (
  <Wrapper>
    <div style={{ padding: '10px' }}>
      <StrongText>Description</StrongText>
      <div
        style={{ whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{
          __html: props.club.description || EMPTY_DESCRIPTION,
        }}
      />
      {props.club.how_to_get_involved && (
        <div>
          <div style={{ marginTop: 20 }}>
            <b>Getting Involved</b>
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {props.club.how_to_get_involved}
          </div>
        </div>
      )}
    </div>{' '}
  </Wrapper>
)
