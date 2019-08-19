import React from 'react'
import Select from 'react-select'
import ClubList from '../components/ClubList.js'
import ClubModal from '../components/ClubModal.js'
import { renderListPage } from '../renderPage.js'
import { CLUBS_GREY } from '../colors'

class Favorites extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: false,
      modalClub: {}
    }
  }

  render() {
    var { tags, favorites, updateFavorites, openModal, closeModal, favoriteClubs } = this.props
    return (
      <div style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', marginBottom: '8rem', minHeight: '72vh', flexDirection: 'column' }}>
        <div style={{ padding: '30px 0' }}>
          <h1 className="title" style={{ color: CLUBS_GREY }}>Favorites</h1>
        </div>
        {favoriteClubs.map((club) => (
          <ClubList
            key={club.id}
            club={club}
            tags={tags}
            updateFavorites={updateFavorites}
            openModal={openModal}
            favorite={favorites.includes(club.id)}/>
        ))}
        {!favorites.length ? <p className="has-text-light-grey" style={{ paddingTop: 200 }}>No favorites yet! Browse clubs <a href="/">here.</a></p> : <div></div>}
      </div>
    )
  }
}

export default renderListPage(Favorites)
