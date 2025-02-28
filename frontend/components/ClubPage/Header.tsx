import { CSSProperties, ReactElement } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { 
  doApiRequest
} from '../../utils'
import { InactiveTag, TagGroup, Title } from '../common'
import Diff from './Diff'

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


const Header = ({ club, style }: HeaderProps): ReactElement => {
  const { active, name, tags, badges } = club

  const retrieveDiffs = async () => {
    const resp = await doApiRequest(`/clubs/${club.code}/club_detail_diff/?format=json`, {
      method: 'GET'
    })
    const json = await resp.json()
    return json[club.code]
  }


  if (club.approved == null) {

    const diffs = retrieveDiffs()
    let oldTitle = diffs["title"]["old"]
    if (oldTitle == null){
      oldTitle = ""
    }
    let newTitle = diffs["title"]["new"]
    if (newTitle == null){
      newTitle = ""
    }

    return (

      <div style={style}>
      <Wrapper>
        <Title style={{ marginBottom: '0.25rem' }}>
          <Diff oldString={oldTitle} newString={newTitle} opacity={0.5}></Diff>
          {!active && <InactiveTag />}
        </Title>
      </Wrapper>
      <div style={{ marginBottom: '1rem' }}>
        <TagGroup tags={[...tags, ...badges]} />
      </div>
    </div>
    )

  }
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