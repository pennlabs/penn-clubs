import React from 'react'
import s from 'styled-components'

import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import { mediaMaxWidth, SM } from '../constants/measurements'

// TODO PropTypes

const ClubTableRowWrapper = s.div`
  ${mediaMaxWidth(SM)} {
    margin-left: -1rem;
    margin-right: 1rem;
    width: calc(100vw);
  }
`

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tagSelected: [],
      sizeSelected: [],
      applicationSelected: [],
      nameInput: '',
      end: 10,
    }
  }

  onScroll = () => {
    const { innerHeight = 0, scrollY = 0 } = window
    const {
      body: { offsetHeight = 0 },
    } = document
    const { end } = this.state

    if (innerHeight + scrollY >= offsetHeight - 500) {
      this.setState({ end: end + 20 })
    }
  }

  componentDidMount() {
    // The "false" means do not add additional event listener options
    window.addEventListener('scroll', this.onScroll, false)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll, false)
  }

  render() {
    const {
      displayClubs,
      tags,
      favorites,
      updateFavorites,
      display,
    } = this.props
    const clubsToShow = displayClubs.slice(0, this.state.end)

    if (display === 'cards') {
      return (
        <div className="columns is-multiline is-desktop is-tablet">
          {clubsToShow.map(club => (
            <ClubCard
              key={club.code}
              club={club}
              tags={tags}
              updateFavorites={updateFavorites}
              favorite={favorites.includes(club.code)}
            />
          ))}
        </div>
      )
    }

    return (
      <ClubTableRowWrapper>
        {clubsToShow.map(club => (
          <ClubTableRow
            club={club}
            key={club.code}
            tags={tags}
            updateFavorites={updateFavorites}
            favorite={favorites.includes(club.code)}
          />
        ))}
      </ClubTableRowWrapper>
    )
  }
}

export default ClubDisplay
