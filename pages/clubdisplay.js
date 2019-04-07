import React from 'react'
import ClubCard from '../components/ClubCard'
import Modal from '../components/Modal'

class ClubDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    var { clubs, tags, openModal, favorites, updateFavorites } = this.props
    return (
      <div>
        <div className="columns is-multiline" style={{ padding: "2rem", marginTop: 150 }}>
          {clubs.map((club) => (
            <ClubCard
              club={club}
              tags={tags}
              openModal={openModal}
              favorite={favorites.includes(club.id)}
              updateFavorites={updateFavorites}/>
          ))}
        </div>
      </div>);
  }
}

export default ClubDisplay
