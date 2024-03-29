import { ReactElement, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'

import { Club } from '~/types'
import { doApiRequest } from '~/utils'

import ClubCard from '../ClubCard'
import { Collapsible } from '../SearchBar'

type RankDropdownProps = {
  onReloadRankings?: () => void
}

const breatheAnimation = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 0.8; }
  100% { opacity: 0.5; }
`

// Styled component for the skeleton block
const SkeletonBlock = styled.div`
  flex: 1;
  height: 150px;
  background-color: #ccc; // Change this color to match your skeleton background
  animation: ${breatheAnimation} 1.5s ease-in-out infinite;
`

function RankDropdown(props: RankDropdownProps): ReactElement {
  const [club1, setClub1] = useState<Club>()
  const [club2, setClub2] = useState<Club>()
  const [loading, setLoading] = useState<boolean>(true)
  const [tooSoon, setTooSoon] = useState<boolean>(false)
  async function reload() {
    setLoading(true)
    doApiRequest(`/clubrank/get_match`).then((resp) => {
      resp.json().then((json) => {
        setClub1(json.club1)
        setClub2(json.club2)
        setLoading(false)
      })
    })
  }

  async function submitWin(winner: string, loser: string) {
    setLoading(true)
    // construct query params
    const params = new URLSearchParams({
      club1: winner,
      club2: loser,
    })
    doApiRequest(`/clubrank/rank/?${params.toString()}`, {
      method: 'POST',
    }).then(async (resp) => {
      setLoading(false)
      const json = await resp.json()
      if (resp.ok && json.success) {
        setTooSoon(true)
        // set async function to reset
        props.onReloadRankings?.()
        reload()
        setTimeout(() => {
          setTooSoon(false)
        }, 3000)
      } else {
        alert(json.message)
      }
    })
  }
  useEffect(() => {
    reload()
  }, [])
  return (
    <Collapsible name="Rate Clubs (click the club to vote)">
      <style>
        {`
          .clubs-container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
          }
          
          @media (min-width: 768px) {
            .clubs-container {
              flex-direction: row;
            }
          }
        `}
      </style>
      <div className="clubs-container">
        {loading || tooSoon ? (
          <>
            <SkeletonBlock />
            <SkeletonBlock />
          </>
        ) : (
          club1 &&
          club2 && (
            <>
              <div
                style={{ flex: '1' }}
                onClick={() => submitWin(club1.code, club2.code)}
              >
                <ClubCard key={club1.code} club={club1} clickable fullWidth />
              </div>
              <div
                style={{ flex: '1' }}
                onClick={() => submitWin(club2.code, club1.code)}
              >
                <ClubCard key={club2.code} club={club2} clickable fullWidth />
              </div>
            </>
          )
        )}
      </div>
    </Collapsible>
  )
}

export default RankDropdown
