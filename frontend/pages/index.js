import React from 'react'
import s from 'styled-components'
import Fuse from 'fuse.js'
import SearchBar from '../components/SearchBar'
import ClubDisplay from '../components/ClubDisplay'
import DisplayButtons from '../components/DisplayButtons'
import { renderListPage } from '../renderPage.js'
import { mediaMaxWidth, MD } from '../constants/measurements'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_BLUE,
  CLUBS_RED,
  FOCUS_GRAY,
  SNOW,
  CLUBS_NAVY,
} from '../constants/colors'
import { logEvent } from '../utils/analytics'
import { WideContainer, Metadata, Title } from '../components/common'
import { doApiRequest } from '../utils'

const colorMap = {
  Tags: CLUBS_BLUE,
  Size: CLUBS_NAVY,
  Application: CLUBS_RED,
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

const ResultsText = s.div`
  color: ${CLUBS_GREY_LIGHT};
  text-decoration: none !important;
  background: transparent !important;
  fontSize: .7em;
  margin: 5px;
`

const Container = s.div`
  width: 80vw;
  margin-left: 20vw;
  padding: 0;

  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin-left: 0;
  }
`

class Splash extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      clubs: props.clubs,
      clubCount: props.clubCount,
      clubLoaded: false,
      displayClubs: props.clubs,
      selectedTags: [],
      nameInput: '',
      display: 'cards',
    }
    this.fuseOptions = {
      keys: [
        {
          name: 'name',
          weight: 0.4,
        },
        {
          name: 'tags.name',
          weight: 0.3,
        },
        {
          name: 'subtitle',
          weight: 0.2,
        },
        {
          name: 'description',
          weight: 0.1,
        },
      ],
      tokenize: true,
      findAllMatches: true,
      shouldSort: true,
      minMatchCharLength: 2,
      threshold: 0.2,
    }

    this.shuffle = this.shuffle.bind(this)
    this.switchDisplay = this.switchDisplay.bind(this)
  }

  componentDidMount() {
    const loadedClubs = new Set()
    this.state.clubs.forEach(c => loadedClubs.add(c.code))

    const paginationDownload = (url, count) => {
      doApiRequest(url)
        .then(res => res.json())
        .then(res => {
          this.setState(state => {
            const newClubs = res.results.filter(c => !loadedClubs.has(c.code))
            res.results.forEach(c => loadedClubs.add(c.code))
            return {
              clubs: state.clubs.concat(newClubs),
              clubCount: res.count,
            }
          })
          if (!res.next || count === 0) {
            this.setState(state => ({ displayClubs: state.clubs }))
            this.fuse = new Fuse(this.state.clubs, this.fuseOptions)
          }
          if (res.next) {
            paginationDownload(res.next, count + 1)
          } else {
            this.setState({ clubLoaded: true })
          }
        })
    }
    paginationDownload('/clubs/?page=1&format=json', 0)
  }

  resetDisplay(nameInput, selectedTags) {
    const tagSelected = selectedTags.filter(tag => tag.name === 'Tags')
    const sizeSelected = selectedTags.filter(tag => tag.name === 'Size')
    const applicationSelected = selectedTags.filter(
      tag => tag.name === 'Application'
    )
    let { clubs } = this.state

    // fuzzy search
    if (this.fuse && nameInput.length) {
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

    const displayClubs = clubs
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
    const { userInfo } = this.props
    const { clubs } = this.state

    let userSchools = new Set()
    let userMajors = new Set()

    if (userInfo) {
      userSchools = new Set(userInfo.school.map(a => a.name))
      userMajors = new Set(userInfo.major.map(a => a.name))
    }
    clubs.forEach(club => {
      club.rank = 0
      const hasSchool = club.target_schools.some(({ name }) =>
        userSchools.has(name)
      )
      const hasMajor = club.target_majors.some(({ name }) =>
        userMajors.has(name)
      )
      const hasYear =
        userInfo &&
        club.target_years.some(({ year }) => userInfo.graduation_year === year)
      const hasDescription = club.description.length > 8
      if (hasSchool) {
        club.rank += Math.max(0, 1 - club.target_schools.length / 4)
      }
      if (hasYear) {
        club.rank += Math.max(0, 1 - club.target_years.length / 4)
      }
      if (hasMajor) {
        club.rank += 3 * Math.max(0, 1 - club.target_majors.length / 10)
      }
      if (!hasDescription) {
        club.rank -= 1
      }
      if (!club.active) {
        club.rank -= 5
      }
      club.rank += 2 * Math.random()
    })
    this.setState({
      displayClubs: clubs.sort((a, b) => {
        if (a.rank > b.rank) {
          return -1
        }
        if (b.rank > a.rank) {
          return 1
        }
        return 0
      }),
    })
  }

  render() {
    const {
      clubs,
      clubLoaded,
      clubCount,
      displayClubs,
      display,
      selectedTags,
      nameInput,
    } = this.state
    const { tags, favorites, updateFavorites } = this.props
    return (
      <>
        <Metadata />
        <div style={{ backgroundColor: SNOW }}>
          <SearchBar
            clubs={clubs}
            tags={tags}
            resetDisplay={this.resetDisplay.bind(this)}
            switchDisplay={this.switchDisplay.bind(this)}
            selectedTags={selectedTags}
            updateTag={this.updateTag.bind(this)}
          />

          <Container>
            <WideContainer background={SNOW}>
              <div style={{ padding: '30px 0' }}>
                <DisplayButtons
                  shuffle={this.shuffle}
                  switchDisplay={this.switchDisplay}
                />

                <Title className="title" style={{ color: CLUBS_GREY }}>
                  Browse Clubs
                </Title>
                <p
                  className="subtitle is-size-5"
                  style={{ color: CLUBS_GREY_LIGHT }}
                >
                  Find your people!
                </p>
              </div>
              <ResultsText>
                {' '}
                {clubLoaded ? displayClubs.length : clubCount} results
              </ResultsText>

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
                        onClick={() => this.updateTag(tag, tag.name)}
                      />
                    </span>
                  ))}
                  <ClearAllLink
                    className="tag is-rounded"
                    onClick={() =>
                      this.setState(
                        { selectedTags: [] },
                        this.resetDisplay(nameInput, [])
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
                updateFavorites={updateFavorites}
              />
            </WideContainer>
          </Container>
        </div>
      </>
    )
  }
}

export default renderListPage(Splash)
