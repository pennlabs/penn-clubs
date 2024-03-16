import { ReactElement, useEffect } from 'react'
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
  ranked?: boolean
}

const ClubDisplay = ({
  displayClubs,
  display,
  onScroll = () => undefined,
  ranked,
}: ClubDisplayProps): ReactElement | null => {
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
      <div className="columns is-multiline is-desktop is-tablet">
        {displayClubs.map((club) => (
          <ClubCard key={club.code} club={club} />
        ))}
      </div>
    )
  }

  if (ranked) {
    // Separate clubs by tier property
    const tieredClubs = displayClubs.reduce((acc, club) => {
      const tier = club.tier || ' '
      if (!acc[tier]) {
        acc[tier] = []
      }
      acc[tier].push(club)
      return acc
    }, {})

    const tierColors = {
      S: 'salmon', // Paler light red
      A: 'peachpuff', // Paler light orange
      B: 'lightgoldenrodyellow', // Paler light yellow
      C: 'palegreen', // Paler light green
      D: 'powderblue', // Paler light turquoise
      E: 'plum', // Paler light purple
      F: 'mistyrose', // Paler light pink
      ' ': '#CCCCCC',
    }

    return (
      <ClubTableRowWrapper>
        {Object.entries(tieredClubs).map(([tier, clubs]: [string, Club[]]) => (
          <div
            key={tier}
            style={{
              borderRadius: '10px',
              backgroundColor: tierColors[tier],
              position: 'relative',
              marginTop: '20px',
            }}
          >
            {tier !== ' ' && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF33',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  lineHeight: '36px',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                }}
              >
                {`${tier}`}
              </div>
            )}
            <div style={{ padding: '4px 16px 4px' }}>
              {clubs.map((club: Club) => (
                <ClubTableRow club={club} key={club.code} showElo />
              ))}
            </div>
          </div>
        ))}
      </ClubTableRowWrapper>
    )
  }

  return (
    <ClubTableRowWrapper>
      {displayClubs.map((club) => (
        <ClubTableRow club={club} key={club.code} />
      ))}
    </ClubTableRowWrapper>
  )
}

export default ClubDisplay
