import React from 'react'
import s from 'styled-components'

import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import { mediaMaxWidth, SM } from '../constants/measurements'

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
      end: 8
    }
  }

  onScroll = () => {
    if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500)) {
      this.setState({ end: this.state.end + 20 })
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll, false)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll, false)
  }

  render() {
    const {
      displayClubs, tags, openModal, favorites, updateFavorites, display, updateTag, selectedTags
    } = this.props
    const clubsToShow = displayClubs.slice(0, this.state.end)

    return (
      <Wrapper>
        {display === 'cards' ? (
          <div className="columns is-multiline is-desktop is-tablet">
            {clubsToShow.map(club => (
              <ClubCard
                key={club.id}
                club={club}
                tags={tags}
                selectedTags={selectedTags}
                updateTag={updateTag}
                openModal={openModal}
                updateFavorites={updateFavorites}
                favorite={favorites.includes(club.id)}/>
            ))}
          </div>
        ) : (
          <ClubTableRowWrapper>
            {clubsToShow.map(club => (
              <ClubTableRow
                club={club}
                key={club.id}
                tags={tags}
                selectedTags={selectedTags}
                updateTag={updateTag}
                updateFavorites={updateFavorites}
                openModal={openModal}
                favorite={favorites.includes(club.id)}/>
            ))}
          </ClubTableRowWrapper>
        )}
      </Wrapper>
    )
  }
}

export default ClubDisplay
