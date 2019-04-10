import React from 'react'
import Select from 'react-select'
import Footer from '../components/Footer'
import ClubList from '../components/ClubList.js'
import ClubModal from '../components/ClubModal.js'
import renderPage from '../renderPage.js'


class Favorites extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      favorites: props.favorites,
      modal: false,
      modalClub: {},
    }
  }

  componentDidMount() {
    var favorites = JSON.parse(localStorage.getItem('favorites'))
    var { clubs } = this.props
    favorites = favorites.map((favorite) => {
      return (clubs.find((club) => club.id == favorite)).id
    })
    this.setState({ favorites })
  }

  openModal(club) {
    club.favorite = this.props.favorites.includes(club.id)
    this.setState({modal: true, modalClub: club})
  }

  closeModal(club) {
    this.setState({modal: false, modalClub: {}})
  }

  findClubById(id) {
    return this.props.clubs.find((club) => club.id == id);
  }

  render() {
    var { favorites, modal, modalClub } = this.state
    var { tags, updateFavorites, isFavorite } = this.props
    return (
      <div style={{  }}>
        <div style={{marginTop: 50, padding: '2rem'}}>
          <h1 className="title">Favorites</h1>
        </div>
        <div>
          {favorites.map((favorite) => (
            <ClubList
              club={this.findClubById(favorite)}
              tags={tags}
              updateFavorites={this.updateFavorites.bind(this)}
              openModal={this.openModal.bind(this)}/>
          ))}
        </div>
        <Footer />
        <ClubModal
          modal={modal}
          club={modalClub}
          closeModal={this.closeModal.bind(this)}
          updateFavorites={updateFavorites}
          favorite={isFavorite(club.id)} />
      </div>
    );
  }
}


export default renderPage(Favorites);
