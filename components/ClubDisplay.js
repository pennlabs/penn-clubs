import React from 'react'
import ClubCard from '../components/ClubCard'

class ClubDisplay extends React.Component{
  constructor(props) {
    super(props)
  }

  shouldComponentUpdate(nextProps) {
    return false
  }

  render() {
    console.log("render")
    var { displayClubs, tags, openModal, favorites, updateFavorites } = this.props
    return (
      <div className="columns is-multiline" style={{ padding: "2rem", marginTop: 130 }}>
        {displayClubs.map((club) => (
          <ClubCard
            club={club}
            tags={tags}
            openModal={openModal}
            favorite={favorites.includes(club.id)}
            updateFavorites={updateFavorites}/>
        ))}
      </div>
    )
  }
}

export default ClubDisplay
