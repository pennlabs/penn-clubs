import React from 'react'
import s from 'styled-components'
import Fuse from 'fuse.js'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import { renderListPage } from '../renderPage.js'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_BLUE, CLUBS_RED, CLUBS_YELLOW, FOCUS_GRAY
} from '../constants/colors'

const ClearAllLink = s.span`
  cursor: pointer;
  color: ${CLUBS_GREY_LIGHT};
  text-decoration: none !important;
  background: transparent !important;
  fontSize: .7em;
  margin: 5px;

  &:hover {
    background: ${FOCUS_GRAY} !important;
  }
`

class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      displayClubs: props.clubs.sort(() => Math.random() - 0.5),
      selectedTags: [],
      nameInput: '',
      modal: false,
      modalClub: {},
      display: 'cards'
    }
    this.fuseOptions = {
      keys: [
        'name',
        'tags.name'
      ]
    }
    this.fuse = new Fuse(this.props.clubs, this.fuseOptions)
  }

  resetDisplay(nameInput, selectedTags) {
    const tagSelected = selectedTags.filter(tag => tag.name === 'Type')
    const sizeSelected = selectedTags.filter(tag => tag.name === 'Size')
    const applicationSelected = selectedTags.filter(tag => tag.name === 'Application')
    var { clubs } = this.props

    // fuzzy search
    if (nameInput.length) {
      clubs = this.fuse.search(nameInput)
    }

    // checkbox filters
    clubs = clubs.filter(club => {
      const clubRightSize = !sizeSelected.length || sizeSelected.findIndex(sizeTag => sizeTag.value === club.size) !== -1
      const appRequired = !applicationSelected.length || (applicationSelected.findIndex(appTag => appTag.value === 1) !== -1 && club.application_required) ||
        (applicationSelected.findIndex(appTag => appTag.value === 2) !== -1 && !club.application_required) ||
        (applicationSelected.findIndex(appTag => appTag.value === 3) !== -1 && club.accepting_applications)
      const rightTags = !tagSelected.length || club.tags.some(club_tag => tagSelected.findIndex(tag => tag.value === club_tag.id) !== -1)

      return clubRightSize && appRequired && rightTags
    })

    var displayClubs = clubs
    this.setState({ displayClubs, nameInput, selectedTags })
  }

  switchDisplay(display) {
    this.setState({ display })
    this.forceUpdate()
  }

  updateTag(tag, name) {
    const { selectedTags } = this.state
    var { value } = tag
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
    var { clubs, tags, favorites, updateFavorites, openModal } = this.props
    return (
      <div className="columns is-gapless is-mobile" style={{ minHeight: '59vh', marginRight: 20 }}>
        <div className="column is-2-desktop is-3-tablet is-5-mobile">
          <SearchBar
            clubs={clubs}
            tags={tags}
            resetDisplay={this.resetDisplay.bind(this)}
            switchDisplay={this.switchDisplay.bind(this)}
            selectedTags={selectedTags}
            updateTag={this.updateTag.bind(this)} />
        </div>
        <div className="column is-10-desktop is-9-tablet is-7-mobile" style={{ marginLeft: 40 }}>
          <div style={{ padding: '30px 0' }}>
            <button
              onClick={() => this.setState({
                displayClubs: displayClubs.sort(() => Math.random() - 0.5)
              })}
              className="button is-light is-small"
              style={{ float: 'right', right: '40px' }}>
              <i className="fas fa-random"></i>
              &nbsp;&nbsp;
              Shuffle
            </button>
            <p className="title" style={{ color: CLUBS_GREY }}>
              Browse Clubs
            </p>
            <p className="subtitle is-size-5" style={{ color: CLUBS_GREY_LIGHT }}>
              Find your people!
            </p>
          </div>

          {selectedTags.length ? (
            <div style={{ padding: '0 30px 30px 0' }}>
              {selectedTags.map(tag => (
                <span
                  key={tag.label}
                  className="tag is-rounded has-text-white"
                  style={{
                    backgroundColor: {
                      Type: CLUBS_BLUE,
                      Size: CLUBS_RED,
                      Application: CLUBS_YELLOW
                    }[tag.name],
                    margin: 3
                  }}>
                  {tag.label}
                  <button
                    className="delete is-small"
                    onClick={(e) => this.updateTag(tag, tag.name)}
                  />
                </span>
              ))}
              <ClearAllLink
                className="tag is-rounded"
                onClick={(e) => this.setState(
                  { selectedTags: [] },
                  this.resetDisplay(this.state.nameInput, this.state.selectedTags)
                )}>
                Clear All
              </ClearAllLink>
            </div>
          ) : ''}

          <ClubDisplay
            displayClubs={displayClubs}
            display={display}
            tags={tags}
            favorites={favorites}
            openModal={openModal}
            updateFavorites={updateFavorites}
            selectedTags={selectedTags}
          />
        </div>
      </div>
    )
  }
}

export default renderListPage(Splash)
