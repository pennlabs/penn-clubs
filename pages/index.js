import Header from '../components/Header'
import Footer from '../components/Footer'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import ClubModal from '../components/ClubModal'
import renderPage from '../renderPage.js'
import { CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_PURPLE, CLUBS_BLUE, RED, YELLOW } from '../colors'


class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      displayClubs: props.clubs,
      selectedTags: [],
      nameInput: "",
      modal: false,
      modalClub: {},
      display: "cards"
    }
  }

  resetDisplay(nameInput, selectedTags) {
    var tagSelected = selectedTags.filter(tag => tag.name === "Type")
    var sizeSelected = selectedTags.filter(tag => tag.name === "Size")
    var applicationSelected = selectedTags.filter(tag => tag.name === "Application")
    var { clubs } = this.props
    clubs = nameInput ? clubs.filter(club => club.name.toLowerCase().indexOf(nameInput.toLowerCase()) !== -1) : clubs
    clubs = sizeSelected.length && clubs.length ? clubs.filter(club =>
      (sizeSelected.findIndex(sizeTag => sizeTag.value === club.size) !== -1)
    ) : clubs
    clubs = applicationSelected.length && clubs.length ? clubs.filter(club => {
      var contains = false
      if (applicationSelected.findIndex(appTag => appTag.value === 1) !== -1 && club.application_required ||
          applicationSelected.findIndex(appTag => appTag.value === 2) !== -1  && !club.application_required ||
          applicationSelected.findIndex(appTag => appTag.value === 3) !== -1  && club.accepting_applications
        ) {
        contains = true
      }
      return contains
    }): clubs
    clubs = tagSelected.length && clubs.length ? clubs.filter(club => {
      var contains
      club.tags.forEach(id => {
        if (tagSelected.findIndex(tag => tag.value === id) !== -1 ) {
          contains = true
        }
      })
      return contains
    }): clubs
    var displayClubs = clubs
    this.setState({ displayClubs, nameInput, selectedTags })
  }

  switchDisplay(display) {
    this.setState({ display })
    this.forceUpdate()
  }

  updateTag(tag, name) {
    var { selectedTags } = this.state
    var { value, label } = tag
    var i = selectedTags.findIndex(tag => tag.value === value && tag.name === name)
    if (i === -1) {
      tag.name = name
      selectedTags.push(tag)
    } else {
      selectedTags.splice(i, 1)
    }
    this.setState({ selectedTags }, this.resetDisplay(this.state.nameInput, this.state.selectedTags))
  }

  render() {
    var { displayClubs, display, selectedTags } = this.state
    var { clubs, tags, favorites, updateFavorites, openModal, closeModal } = this.props
    return(
      <div className="columns is-gapless is-mobile" style={{minHeight: "59vh", marginRight: 20}}>
        <div className="column is-2-desktop is-3-tablet is-5-mobile">
          <SearchBar
            clubs={clubs}
            tags={tags}
            resetDisplay={this.resetDisplay.bind(this)}
            switchDisplay={this.switchDisplay.bind(this)}
            selectedTags={selectedTags}
            updateTag={this.updateTag.bind(this)} />
          </div>
        <div className="column is-10-desktop is-9-tablet is-7-mobile" style={{marginLeft: 40}}>
          <div style={{padding: "30px 0"}}>
            <p className="title" style={{color: CLUBS_GREY}}>Browse Clubs</p>
            <p className="subtitle is-size-5" style={{color: CLUBS_GREY_LIGHT}}>Find your people!</p>
            <div>
              {selectedTags.length ? (
                <div>
                  {selectedTags.map(tag => (
                    <span
                      className="tag is-rounded has-text-dark"
                      style={{
                        backgroundColor: "#e5e5e5",
                        margin: 3,
                      }}>
                      {tag.label}
                      <button class="delete is-small" onClick={(e)=>this.updateTag(tag, tag.name)}></button>
                    </span>
                  ))}
                  <span onClick={(e)=>this.setState({selectedTags: []}, this.resetDisplay(this.state.nameInput, this.state.selectedTags))} style={{color: CLUBS_GREY_LIGHT, textDecoration:"underline", fontSize: ".7em", margin: 5}}>Clear All</span>
                </div>) : ""}
              </div>
            </div>
          <ClubDisplay
            displayClubs={displayClubs}
            display={display}
            tags={tags}
            favorites={favorites}
            openModal={openModal}
            updateFavorites={updateFavorites}
            selectedTags={selectedTags} />
          </div>

      </div>
    );
  }
}

export default renderPage(Splash);
