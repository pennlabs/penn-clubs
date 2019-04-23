import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import ClubModal from '../components/ClubModal'
import renderPage from '../renderPage.js'
import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'


class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      displayClubs: props.clubs,
      modal: false,
      modalClub: {},
      display: "cards"
    }
  }

  resetDisplay(displayClubs) {
    console.log(displayClubs)
    this.setState({ displayClubs }, this.forceUpdate())

  }

  switchDisplay(display) {
    this.setState({ display })
    this.forceUpdate()
  }

  render() {
    var { displayClubs, display } = this.state
    var { clubs, tags, favorites, updateFavorites, openModal, closeModal } = this.props
    return(
      <div className="columns is-gapless is-mobile" style={{minHeight: "59vh", marginRight: 20}}>
        <div className="column is-2-desktop is-3-tablet is-5-mobile">
          <SearchBar
            clubs={clubs}
            tags={tags}
            resetDisplay={this.resetDisplay.bind(this)}
            switchDisplay={this.switchDisplay.bind(this)} />
          </div>
        <div className="column is-10-desktop is-9-tablet is-7-mobile" style={{marginLeft: 40}}>
          <div style={{padding: "30px 0"}}>
            <p className="title" style={{color: CLUBS_GREY}}>Browse Clubs</p>
            <p className="subtitle is-size-5" style={{color: CLUBS_GREY_LIGHT}}>Find your people!</p>
          </div>
          <ClubDisplay
            displayClubs={displayClubs}
            display={display}
            tags={tags}
            favorites={favorites}
            openModal={openModal}
            updateFavorites={updateFavorites} />
          </div>

      </div>
    );
  }
}

export default renderPage(Splash);
