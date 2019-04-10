import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import ClubModal from '../components/ClubModal'
import renderPage from '../renderPage.js'


class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      displayClubs: props.clubs,
      modal: false,
      modalClub: {}
    }
  }

  resetDisplay(displayClubs) {
    this.setState({ displayClubs })
    this.forceUpdate()
  }

  openModal(club) {
    club.favorite = this.props.favorites.includes(club.id)
    this.setState({modal: true, modalClub: club})
  }

  closeModal(club) {
    this.setState({modal: false, modalClub: {}})
  }

  render() {
    var { displayClubs, modal, modalClub } = this.state
    var { clubs, tags, favorites, updateFavorites, isFavorite } = this.props
    return(
      <div style={ modal ? {position: "fixed", overflow: "hidden"} : {}}>
        <Header />
        <ClubDisplay
          displayClubs={displayClubs}
          tags={tags}
          favorites={favorites}
          openModal={this.openModal.bind(this)}
          updateFavorites={updateFavorites}/>
        <SearchBar
          clubs={clubs}
          tags={tags}
          resetDisplay={this.resetDisplay.bind(this)} />
        <Footer />
        <ClubModal
          modal={modal}
          club={modalClub}
          closeModal={this.closeModal.bind(this)}
          updateFavorites={updateFavorites}
          isFavorite={isFavorite} />
      </div>
    );
  }
}

export default renderPage(Splash);
