import React from 'react'
import s from 'styled-components'

import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import { mediaMaxWidth, SM } from '../constants/measurements'

// TODO PropTypes

const Wrapper = s.div``

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
      end: 8,
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
      openModal,
      favorites,
      updateFavorites,
      display,
      updateTag,
      selectedTags,
    } = this.props
    const clubsToShow = displayClubs.slice(0, this.state.end)

    return (
      <Wrapper>
        {display === 'cards' ? (
          <div className="columns is-multiline is-desktop is-tablet">
            {clubsToShow.map(club => (
              <ClubCard
                key={club.code}
                club={club}
                tags={tags}
                selectedTags={selectedTags}
                updateTag={updateTag}
                openModal={openModal}
                updateFavorites={updateFavorites}
                favorite={favorites.includes(club.code)}
              />
            ))}
          </div>
        ) : (
          <ClubTableRowWrapper>
            {clubsToShow.map(club => (
              <ClubTableRow
                club={club}
                key={club.code}
                tags={tags}
                selectedTags={selectedTags}
                updateTag={updateTag}
                updateFavorites={updateFavorites}
                openModal={openModal}
                favorite={favorites.includes(club.code)}
              />
            ))}
          </ClubTableRowWrapper>
        )}
      </Wrapper>
    )
  }
}

export default ClubDisplay
