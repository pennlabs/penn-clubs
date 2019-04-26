import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import renderPage from '../renderPage'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
} from '../colors'

class Splash extends Component {
  constructor (props) {
    super(props)

    this.state = {
      displayClubs: props.clubs,
      selectedTags: [],
      nameInput: '',
      display: 'cards',
    }

    this.resetDisplay = this.resetDisplay.bind(this)
    this.switchDisplay = this.switchDisplay.bind(this)
    this.updateTag = this.updateTag.bind(this)
  }

  resetDisplay (nameInput, selectedTags) {
    const tagSelected = selectedTags.filter(tag => tag.name === 'Type')
    const sizeSelected = selectedTags.filter(tag => tag.name === 'Size')
    const applicationSelected = selectedTags.filter(tag => tag.name === 'Application')
    let { clubs } = this.props
    clubs = nameInput ? clubs.filter(club => club.name.toLowerCase().indexOf(nameInput.toLowerCase()) !== -1) : clubs
    clubs = sizeSelected.length && clubs.length ? clubs.filter(club => (sizeSelected.findIndex(sizeTag => sizeTag.value === club.size) !== -1)) : clubs
    clubs = applicationSelected.length && clubs.length ? clubs.filter((club) => {
      let contains = false
      if (applicationSelected.findIndex(appTag => appTag.value === 1) !== -1 && club.application_required
          || applicationSelected.findIndex(appTag => appTag.value === 2) !== -1 && !club.application_required
          || applicationSelected.findIndex(appTag => appTag.value === 3) !== -1 && club.accepting_applications
      ) {
        contains = true
      }
      return contains
    }) : clubs
    clubs = tagSelected.length && clubs.length ? clubs.filter((club) => {
      let contains
      club.tags.forEach((id) => {
        if (tagSelected.findIndex(tag => tag.value === id) !== -1) {
          contains = true
        }
      })
      return contains
    }) : clubs
    const displayClubs = clubs
    this.setState({ displayClubs, nameInput, selectedTags })
  }

  switchDisplay (display) {
    this.setState({ display })
    this.forceUpdate()
  }

  updateTag (tag, name) {
    const { selectedTags } = this.state
    const { value, label } = tag
    const i = selectedTags.findIndex(tag => tag.value === value && tag.name === name)
    if (i === -1) {
      tag.name = name
      selectedTags.push(tag)
    } else {
      selectedTags.splice(i, 1)
    }
    this.setState({ selectedTags }, this.resetDisplay(this.state.nameInput, this.state.selectedTags))
  }

  render () {
    const {
      displayClubs,
      display,
      selectedTags,
    } = this.state

    const {
      clubs,
      tags,
      favorites,
      updateFavorites,
      openModal,
    } = this.props

    return (
      <div
        className="columns is-gapless is-mobile"
        style={{ minHeight: '59vh', marginRight: 20 }}
      >
        <div className="column is-2-desktop is-3-tablet is-5-mobile">
          <SearchBar
            clubs={clubs}
            tags={tags}
            resetDisplay={this.resetDisplay}
            switchDisplay={this.switchDisplay}
            selectedTags={selectedTags}
            updateTag={this.updateTag}
          />
        </div>

        <div
          className="column is-10-desktop is-9-tablet is-7-mobile"
          style={{ marginLeft: 40 }}
        >
          <div style={{ padding: '30px 0' }}>
            <p
              className="title"
              style={{ color: CLUBS_GREY }}
            >
              Browse Clubs
            </p>
            <p
              className="subtitle is-size-5"
              style={{ color: CLUBS_GREY_LIGHT }}
            >
              Find your people!
            </p>

            <div>
              {(selectedTags.length !== 0) ? (
                <div>
                  {selectedTags.map(tag => (
                    <span
                      className="tag is-rounded has-text-dark"
                      style={{
                        backgroundColor: '#e5e5e5',
                        margin: 3,
                      }}
                    >
                      {tag.label}
                      <button
                        className="delete is-small"
                        onClick={() => this.updateTag(tag, tag.name)}
                        type="button"
                      />
                    </span>
                  ))}

                  <span
                    onClick={() => (
                      this.setState(
                        { selectedTags: [] },
                        this.resetDisplay(this.state.nameInput, this.state.selectedTags)
                      )
                    )}
                    onKeyPress={() => (
                      this.setState(
                        { selectedTags: [] },
                        this.resetDisplay(this.state.nameInput, this.state.selectedTags)
                      )
                    )}
                    role="button"
                    tabIndex={0}
                    style={{
                      color: CLUBS_GREY_LIGHT, textDecoration: 'underline', fontSize: '.7em', margin: 5,
                    }}
                  >
Clear All
                  </span>
                </div>
              ) : null}
            </div>
          </div>
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

Splash.propTypes = {
  clubs: PropTypes.arrayOf(PropTypes.string).isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  favorites: PropTypes.arrayOf(PropTypes.string).isRequired,
  updateFavorites: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
}

export default renderPage(Splash)
