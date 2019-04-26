import React from 'react'
import ClubCard from '../components/ClubCard'
import ClubList from '../components/ClubList'
import ClubTableRow from '../components/ClubTableRow'

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tagSelected: [],
      sizeSelected: [],
      applicationSelected: [],
      nameInput: "",
      selectedTags: props.selectedTags
    }
  }

  render() {
    var { displayClubs, tags, openModal, favorites, updateFavorites, display } = this.props
    return (
      <div style={{paddingRight: 40}}>
        {display == "cards" ? (
          <div className="columns is-multiline is-desktop is-tablet">
            { displayClubs.map((club) => (
              <ClubCard
                club={club}
                tags={tags}
                openModal={openModal}
                updateFavorites={updateFavorites}
                favorite={favorites.includes(club.id)}/>
            )) }
          </div>
        ) : (
            <table className="table is-fullwidth is-hoverable" style={{borderTop: "1px solid #e5e5e5"}}>
              <tbody>
                {displayClubs.map((club) => (
                  <ClubTableRow
                    club={club}
                    tags={tags}
                    updateFavorites={updateFavorites}
                    openModal={openModal}
                    favorite={favorites.includes(club.id)}/>
                ))}
              </tbody>
            </table>
        )
      }
    </div>
    )
  }
}

export default ClubDisplay
