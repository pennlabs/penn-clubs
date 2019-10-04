import React from 'react'
import s from 'styled-components'
import Fuse from 'fuse.js'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import DisplayButtons from '../components/DisplayButtons'
import { renderListPage } from '../renderPage.js'
import {
  mediaMaxWidth,
  mediaMinWidth,
  MD,
  LG,
  XL,
} from '../constants/measurements'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_BLUE,
  CLUBS_RED,
  CLUBS_YELLOW,
  FOCUS_GRAY,
} from '../constants/colors'
import { logEvent } from '../utils/analytics'

const colorMap = {
  Type: CLUBS_BLUE,
  Size: CLUBS_RED,
  Application: CLUBS_YELLOW,
}

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

const Wrapper = s.div`
  min-height: 59vh;
  margin-right: 20px;

  ${mediaMaxWidth(MD)} {
    margin-right: 0;
  }
`

const Container = s.div`
  width: 80vw;
  margin-left: 20vw;
  padding: 0 1rem;

  ${mediaMinWidth(LG)} {
    padding: 0 calc(2.5% + 1rem);
  }

  ${mediaMinWidth(XL)} {
    padding: 0 calc(5% + 1rem);
  }

  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin-left: 0;
  }
`

class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      displayClubs: props.clubs,
      selectedTags: [],
      nameInput: '',
      modal: false,
      modalClub: {},
      display: 'cards',
    }
    this.fuseOptions = {
      keys: [
        {
          name: 'name',
          weight: 0.6
        },
        {
          name: 'tags.name',
          weight: 0.5
        },
        {
          name: 'subtitle',
          weight: 0.3
        },
        {
          name: 'description',
          weight: 0.1
        }
      ],
      tokenize: true,
      findAllMatches: true,
      shouldSort: true,
      minMatchCharLength: 2,
      threshold: 0.2,
    }
    this.fuse = new Fuse(this.props.clubs, this.fuseOptions)

    this.shuffle = this.shuffle.bind(this)
    this.switchDisplay = this.switchDisplay.bind(this)
  }

  componentDidMount() {
    this.setState(state => ({
      displayClubs: state.displayClubs.sort(() => Math.random() - 0.5),
    }))
  }

  resetDisplay(nameInput, selectedTags) {
    const tagSelected = selectedTags.filter(tag => tag.name === 'Type')
    const sizeSelected = selectedTags.filter(tag => tag.name === 'Size')
    const applicationSelected = selectedTags.filter(
      tag => tag.name === 'Application'
    )
    var { clubs } = this.props

    // fuzzy search
    if (nameInput.length) {
      clubs = this.fuse.search(nameInput)
    }

    // checkbox filters
    clubs = clubs.filter(club => {
      const clubRightSize =
        !sizeSelected.length ||
        sizeSelected.findIndex(sizeTag => sizeTag.value === club.size) !== -1
      const appRequired =
        !applicationSelected.length ||
        (applicationSelected.findIndex(appTag => appTag.value === 1) !== -1 &&
          club.application_required !== 1) ||
        (applicationSelected.findIndex(appTag => appTag.value === 2) !== -1 &&
          club.application_required === 1) ||
        (applicationSelected.findIndex(appTag => appTag.value === 3) !== -1 &&
          club.accepting_members)
      const rightTags =
        !tagSelected.length ||
        club.tags.some(
          clubTag =>
            tagSelected.findIndex(tag => tag.value === clubTag.id) !== -1
        )

      return clubRightSize && appRequired && rightTags
    })

    var displayClubs = clubs
    this.setState({ displayClubs, nameInput, selectedTags })
  }

  switchDisplay(display) {
    logEvent('viewMode', display)
    this.setState({ display })
    this.forceUpdate()
  }

  updateTag(tag, name) {
    const { selectedTags } = this.state
    const { value } = tag
    const i = selectedTags.findIndex(
      tag => tag.value === value && tag.name === name
    )

    if (i === -1) {
      tag.name = name
      selectedTags.push(tag)
    } else {
      selectedTags.splice(i, 1)
    }

    this.setState(
      { selectedTags },
      this.resetDisplay(this.state.nameInput, this.state.selectedTags)
    )
  }

  shuffle() {
    logEvent('shuffle', 'click')
    const { displayClubs } = this.state
    this.setState({
      displayClubs: displayClubs.sort(() => Math.random() - 0.5),
    })
  }

  render() {
    const { displayClubs, display, selectedTags } = this.state
    const { clubs, tags, favorites, updateFavorites, openModal } = this.props

    return (
      <Wrapper>
        <SearchBar
          clubs={clubs}
          tags={tags}
          resetDisplay={this.resetDisplay.bind(this)}
          switchDisplay={this.switchDisplay.bind(this)}
          selectedTags={selectedTags}
          updateTag={this.updateTag.bind(this)}
        />

        <Container>
          <div style={{ padding: '30px 0' }}>
            <DisplayButtons
              shuffle={this.shuffle}
              switchDisplay={this.switchDisplay}
            />

            <p className="title" style={{ color: CLUBS_GREY }}>
              Browse Clubs
            </p>
            <p
              className="subtitle is-size-5"
              style={{ color: CLUBS_GREY_LIGHT }}
            >
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
                    backgroundColor: colorMap[tag.name],
                    fontWeight: 600,
                    margin: 3,
                  }}
                >
                  {tag.label}
                  <button
                    className="delete is-small"
                    onClick={e => this.updateTag(tag, tag.name)}
                  />
                </span>
              ))}
              <ClearAllLink
                className="tag is-rounded"
                onClick={e =>
                  this.setState(
                    { selectedTags: [] },
                    this.resetDisplay(
                      this.state.nameInput,
                      this.state.selectedTags
                    )
                  )
                }
              >
                Clear All
              </ClearAllLink>
            </div>
          ) : (
            ''
          )}

          <ClubDisplay
            displayClubs={displayClubs}
            display={display}
            tags={tags}
            favorites={favorites}
            openModal={openModal}
            updateFavorites={updateFavorites}
            selectedTags={selectedTags}
            updateTag={this.updateTag.bind(this)}
          />
        </Container>
      </Wrapper>
    )
  }
}

export default renderListPage(Splash)
