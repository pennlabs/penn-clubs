import React from 'react'
import Select from 'react-select'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ClubList from '../components/ClubList.js'
import ClubModal from '../components/ClubModal.js'
import renderPage from '../renderPage.js'


class Favorites extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: false,
      modalClub: {},
    }
  }

  render() {
    var { tags, favorites, updateFavorites, openModal, closeModal, favoriteClubs } = this.props
    return (
      <div style={{padding: '1rem 2rem', marginTop: 60, display: "flex", alignItems: "center", minHeight: "72vh", flexDirection: "column"}}>
        <div>
          <h1 className="title">Favorites</h1>
        </div>
        {favoriteClubs.map((club) => (
          <ClubList
            club={club}
            tags={tags}
            updateFavorites={updateFavorites}
            openModal={openModal}
            favorite={favorites.includes(club.id)}/>
        ))}
        {!favorites.length ? <p className="has-text-light-grey" style={{paddingTop: 200}}>No favorites yet! Browse clubs <a href="/">here.</a></p> : <div></div>}
      </div>
    );
  }
}


export default renderPage(Favorites);
