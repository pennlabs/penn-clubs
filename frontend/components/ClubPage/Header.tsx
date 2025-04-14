import { CSSProperties, ReactElement } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { InactiveTag, TagGroup, Title } from '../common'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
`

type HeaderProps = {
  club: Club
  style?: CSSProperties
}

const Header = ({ club, style }: HeaderProps): ReactElement<any> => {
  const { active, name, tags, badges } = club
  return (
    <div style={style}>
      <Wrapper>
        <Title style={{ marginBottom: '0.25rem' }}>
          {name}
          {!active && <InactiveTag />}
        </Title>
      </Wrapper>
      <div style={{ marginBottom: '1rem' }}>
        <TagGroup tags={[...tags, ...badges]} />
      </div>
    </div>
  )
}

export default Header
