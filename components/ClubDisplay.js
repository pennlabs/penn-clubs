import React from 'react'
import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import s from 'styled-components'

const Wrapper = s.div`
`

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tagSelected: [],
      sizeSelected: [],
      applicationSelected: [],
      nameInput: '',
      selectedTags: props.selectedTags,
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
      displayClubs, tags, openModal, favorites, updateFavorites, display
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
                openModal={openModal}
                updateFavorites={updateFavorites}
                favorite={favorites.includes(club.id)}/>
            ))}
          </div>
        ) : (
          <div>
            <div>
              {clubsToShow.map(club => (
                <ClubTableRow
                  club={club}
                  key={club.id}
                  tags={tags}
                  updateFavorites={updateFavorites}
                  openModal={openModal}
                  favorite={favorites.includes(club.id)}/>
              ))}
            </div>
          </div>
        )}
      </Wrapper>
    )
  }
}

export default ClubDisplay
