import React from 'react'
import s from 'styled-components'

import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import { mediaMaxWidth, SM } from '../constants/measurements'
import { Club, Tag } from '../types'

const ClubTableRowWrapper = s.div`
  ${mediaMaxWidth(SM)} {
    margin-left: -1rem;
    margin-right: 1rem;
    width: calc(100vw);
  }
`

type ClubDisplayProps = {
  displayClubs: [Club]
  tags: [Tag]
  display: string
  updateFavorites: (code: string) => void
}

type ClubDisplayState = {
  end: number
}

class ClubDisplay extends React.Component<ClubDisplayProps, ClubDisplayState> {
  constructor(props: ClubDisplayProps) {
    super(props)
    this.state = {
      end: 10,
    }
  }

  onScroll = (): void => {
    const { innerHeight = 0, scrollY = 0 } = window
    const {
      body: { offsetHeight = 0 },
    } = document
    const { end } = this.state

    if (innerHeight + scrollY >= offsetHeight - 500) {
      this.setState({ end: end + 20 })
    }
  }

  componentDidMount(): void {
    // The "false" means do not add additional event listener options
    window.addEventListener('scroll', this.onScroll, false)
  }

  componentWillUnmount(): void {
    window.removeEventListener('scroll', this.onScroll, false)
  }

  render(): JSX.Element {
    const { displayClubs, updateFavorites, display } = this.props
    const clubsToShow = displayClubs.slice(0, this.state.end)

    if (display === 'cards') {
      return (
        <div className="columns is-multiline is-desktop is-tablet">
          {clubsToShow.map((club) => (
            <ClubCard
              key={club.code}
              club={club}
              updateFavorites={updateFavorites}
              favorite={club.is_favorite}
            />
          ))}
        </div>
      )
    }

    return (
      <ClubTableRowWrapper>
        {clubsToShow.map((club) => (
          <ClubTableRow
            club={club}
            key={club.code}
            updateFavorites={updateFavorites}
          />
        ))}
      </ClubTableRowWrapper>
    )
  }
}

export default ClubDisplay
