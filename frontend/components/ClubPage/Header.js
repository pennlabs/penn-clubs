import { useState } from 'react'
import Link from 'next/link'
import s from 'styled-components'
import { ALLBIRDS_GRAY, SNOW } from '../../constants/colors'

import { TagGroup, InactiveTag, Title, BookmarkIcon, SubscribeIcon } from '../common'
import { ROLE_OFFICER } from '../../utils'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
`

const Header = ({
  club,
  style,
}) => {
  const { active, code, name, tags, badges } = club

  return (
    <div style={style}>
      <Wrapper>
        <Title style={{ marginBottom: '0.25rem' }}>
          {name}
          {!active && <InactiveTag />}
        </Title>
        
      </Wrapper>
      <div style={{ marginBottom: '1rem' }}>
        <TagGroup tags={tags} />
        <TagGroup tags={badges} />
      </div>

    </div>
  )
}

export default Header
