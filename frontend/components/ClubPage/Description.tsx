import { ReactElement } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { EMPTY_DESCRIPTION } from '../../utils'
import { StrongText } from '../common'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

type Props = {
  club: Club
}

const Description = ({ club }: Props): ReactElement<any> => (
  <Wrapper>
    <div style={{ width: '100%' }}>
      <StrongText>Club Mission</StrongText>
      <div
        className="content"
        dangerouslySetInnerHTML={{
          __html: club.description || EMPTY_DESCRIPTION,
        }}
      />
    </div>
  </Wrapper>
)

export default Description
