import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import {
  apiCheckPermission,
  doApiRequest,
  EMPTY_DESCRIPTION,
} from '../../utils'
import { StrongText } from '../common'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  flex: 1;
`

type DescProps = {
  club: Club
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

const Description = ({ club }: DescProps): ReactElement => {

  const [diffs, setDiffs] = useState<ClubDiff | null>(null)
  const canApprove = apiCheckPermission('clubs.approve_club')
  const canDeleteClub = apiCheckPermission('clubs.delete_club')

  const NewDescription = () => {
    return (
      <Wrapper>
        <div style={{ width: '100%' }}>
          <StrongText>Club Mission</StrongText>
          <div></div>
          <div
            className="content"
            dangerouslySetInnerHTML={{
              __html: club.description || EMPTY_DESCRIPTION,
            }}
          />
        </div>
      </Wrapper>
    )
  }


  if (!canApprove || club.approved == false) {
    return <NewDescription />
  }

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

    if (diffs != null) {
      const display = diffs.description.diff
      return (
        <Wrapper>
          <div style={{ width: '100%' }}>
            <StrongText>Description</StrongText>
            <div
              className="content"
              dangerouslySetInnerHTML={{
                __html: display || EMPTY_DESCRIPTION,
              }}
            />
          </div>
        </Wrapper>
      )
    }
  }

  return <NewDescription />
}

export default Description
