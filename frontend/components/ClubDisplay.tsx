import { createContext, ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import { mediaMaxWidth, SM } from '../constants/measurements'
import { Club, Tag } from '../types'

const ClubTableRowWrapper = styled.div`
  ${mediaMaxWidth(SM)} {
    margin-left: -1rem;
    margin-right: 1rem;
    width: calc(100vw);
  }
`

type ClubDisplayProps = {
  displayClubs: Club[]
  tags: Tag[]
  display: 'cards' | 'list'
  onScroll?: () => void
  pageSize?: number
}

interface ClubDisplayContext {
  clubs: Club[]
  updateClub: (
    code: string,
    // we likely want to limit what keys can be changed
    key: 'bookmark' | 'subscribe',
    value: boolean,
  ) => void
}

export const ClubDisplayContext = createContext<Partial<ClubDisplayContext>>({})

const ClubDisplay = ({
  displayClubs,
  display,
  onScroll = () => undefined,
}: ClubDisplayProps): ReactElement | null => {
  const [clubs, setClubs] = useState<Club[]>(displayClubs)
  const updateClub = (code, key, value) => {
    setClubs(
      clubs.map((club) => {
        if (club.code === code) {
          if (key === 'bookmark') {
            club.is_favorite = value
          } else if (key === 'subscribe') {
            club.is_subscribe = value
          }
        }
        return { ...club }
      }),
    )
  }
  const onWindowScroll = (): void => {
    const { innerHeight = 0, scrollY = 0 } = window
    const {
      body: { offsetHeight = 0 },
    } = document

    if (innerHeight + scrollY >= offsetHeight - innerHeight / 2) {
      onScroll()
    }
  }

  if (!displayClubs) {
    return null
  }

  useEffect(() => {
    window.addEventListener('scroll', onWindowScroll, false)
    onWindowScroll()
    return () => window.removeEventListener('scroll', onWindowScroll, false)
  }, [])

  if (display === 'cards') {
    return (
      <ClubDisplayContext.Provider value={{ clubs, updateClub }}>
        <div className="columns is-multiline is-desktop is-tablet">
          {clubs.map((club) => (
            <ClubCard key={club.code} club={club} />
          ))}
        </div>
      </ClubDisplayContext.Provider>
    )
  }

  return (
    <ClubDisplayContext.Provider value={{ clubs, updateClub }}>
      <ClubTableRowWrapper>
        {clubs.map((club) => (
          <ClubTableRow club={club} key={club.code} />
        ))}
      </ClubTableRowWrapper>
    </ClubDisplayContext.Provider>
  )
}

export default ClubDisplay
