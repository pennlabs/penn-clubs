import { CSSProperties, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
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

type ClubDiff = {
  description: {
    old: string
    new: string
    diff: string
  }
  name: {
    old: string
    new: string
    diff: string
  }
  image: {
    old: string
    new: string
  }
}

const Header = ({ club, style }: HeaderProps): ReactElement => {
  const { active, name, tags, affiliations } = club
  const canApprove = apiCheckPermission('clubs.approve_club')

  const NewHeader = () => {
    return (
      <div style={style}>
        <Wrapper>
          <Title style={{ marginBottom: '0.25rem' }}>
            {name}
            {!active && <InactiveTag />}
          </Title>
        </Wrapper>
        <div style={{ marginBottom: '1rem' }}>
          <TagGroup tags={[...tags, ...(affiliations || [])]} />
        </div>
      </div>
    )
  }

  if (!canApprove || club.approved === false) {
    return <NewHeader />
  }

  const [diffs, setDiffs] = useState<ClubDiff | null>(null)

  const retrieveDiffs = async () => {
    const resp = await doApiRequest(
      `/clubs/${club.code}/club_detail_diff/?format=json`,
      {
        method: 'GET',
      },
    )
    const json = await resp.json()
    return json[club.code]
  }

  if (club.approved == null) {
    useEffect(() => {
      const fetchDiffs = async () => {
        if (club.approved == null) {
          const resp = await retrieveDiffs()
          if (
            resp === 'No changes that require approval made since last approval'
          ) {
            setDiffs(null)
          } else {
            setDiffs(resp)
          }
        }
      }
      fetchDiffs()
    }, [club.code])
  }

  if (diffs != null && canApprove) {
    const display = diffs.name.diff
    return (
      <div style={style}>
        <Wrapper>
          <Title style={{ marginBottom: '0.25rem' }}>
            <div
              className="content"
              dangerouslySetInnerHTML={{
                __html: display || name,
              }}
            />
            {!active && <InactiveTag />}
          </Title>
        </Wrapper>
        <div style={{ marginBottom: '1rem' }}>
          <TagGroup tags={[...tags, ...(affiliations || [])]} />
        </div>
      </div>
    )
  }
  return <NewHeader />
}

export default Header
