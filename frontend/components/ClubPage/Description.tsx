import { ReactElement, useState, useEffect } from 'react'
import styled from 'styled-components'

import { Club } from '../../types'
import { 
  EMPTY_DESCRIPTION,
  doApiRequest
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


const Description = ({ club }: DescProps): ReactElement => {


  const { active, name, tags, badges } = club

  const [diffs, setDiffs] = useState(null);
  
  const retrieveDiffs = async () => {
    const resp = await doApiRequest(`/clubs/${club.code}/club_detail_diff/?format=json`, {
      method: 'GET'
    })
    const json = await resp.json()
    return json[club.code]
  }

  if (club.approved == null) {
    useEffect(() => {
      const fetchDiffs = async () => {
        if (club.approved == null) {
          const resp = await retrieveDiffs();
          setDiffs(resp);
        }
      };
      fetchDiffs();
    }, [club.code]);

    if (diffs != null) {
      console.log(diffs)
      let display = diffs["description"]["diff"]
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
  );
}

export default Description;
