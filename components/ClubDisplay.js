import React from 'react'
import ClubCard from '../components/ClubCard'
import ClubTableRow from '../components/ClubTableRow'
import s from 'styled-components'

const Wrapper = s.div`
  padding-right: 40px;
`

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tagSelected: [],
      sizeSelected: [],
      applicationSelected: [],
      nameInput: '',
      selectedTags: props.selectedTags
    }
  }

  render() {
    const { displayClubs, tags, openModal, favorites, updateFavorites, display } = this.props
    return (
      <Wrapper>
        {display === 'cards' ? (
          <div className="columns is-multiline is-desktop is-tablet">
            {displayClubs.map(club => (
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
              {displayClubs.map(club => (
                <ClubTableRow
                  club={club}
                  key={club.id}
                  tags={tags}
                  updateFavorites={updateFavorites}
                  openModal={openModal}
                  favorite={favorites.includes(club.id)}/>
              ))}
            </div>
            <table className="table is-fullwidth is-hoverable">
              <tbody>
                {displayClubs.map(club => (
                  <ClubTableRow
                    club={club}
                    tags={tags}
                    updateFavorites={updateFavorites}
                    openModal={openModal}
                    favorite={favorites.includes(club.id)}/>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Wrapper>
    )
  }
}

export default ClubDisplay
