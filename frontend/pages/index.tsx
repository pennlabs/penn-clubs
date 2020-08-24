import Fuse, { FuseOptions } from 'fuse.js'
import React from 'react'
import s from 'styled-components'

import ClubDisplay from '../components/ClubDisplay'
import ListRenewalDialog from '../components/ClubPage/ListRenewalDialog'
import { Metadata, Title, WideContainer } from '../components/common'
import DisplayButtons from '../components/DisplayButtons'
import SearchBar from '../components/SearchBar'
import {
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_NAVY,
  CLUBS_RED,
  FOCUS_GRAY,
  SNOW,
} from '../constants/colors'
import { MD, mediaMaxWidth } from '../constants/measurements'
import { renderListPage } from '../renderPage'
import {
  Club,
  Tag,
  TargetMajor,
  TargetSchool,
  TargetYear,
  UserInfo,
} from '../types'
import { doApiRequest } from '../utils'
import { logEvent } from '../utils/analytics'

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

interface RankedClub extends Club {
  rank?: number
  target_schools: TargetSchool[]
  target_majors: TargetMajor[]
  target_years: TargetYear[]
}

type SplashProps = {
  userInfo: UserInfo
  clubs: Club[]
  tags: Tag[]
}

type SplashState = {
  clubs: RankedClub[]
  clubLoaded: boolean
  clubCount: number
  displayClubs: RankedClub[]
  selectedTags: any[]
  nameInput: string
  display: string
}

class Splash extends React.Component<SplashProps, SplashState> {
  fuseOptions: FuseOptions<Club>
  fuse: Fuse<Club, FuseOptions<Club>> | null

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
    this.fuse = null
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

  resetDisplay(nameInput, selectedTags) {
    const tagSelected = selectedTags
      .filter((tag) => tag.name === 'Tags')
      .map((tag) => tag.value)
    const sizeSelected = selectedTags
      .filter((tag) => tag.name === 'Size')
      .map((tag) => tag.value)

    const requiredApplication =
      selectedTags.findIndex(
        (tag) => tag.name === 'Application' && tag.value === 1,
      ) !== -1
    const noRequiredApplication =
      selectedTags.findIndex(
        (tag) => tag.name === 'Application' && tag.value === 2,
      ) !== -1
    const acceptingMembers =
      selectedTags.findIndex(
        (tag) => tag.name === 'Application' && tag.value === 3,
      ) !== -1

    let url = '/clubs/?format=json'

    if (nameInput) {
      url += '&search=' + encodeURIComponent(nameInput)
    }
    if (tagSelected.length > 0) {
      url += '&tags=' + encodeURIComponent(tagSelected)
    }
    if (sizeSelected.length > 0) {
      url += '&size__in=' + encodeURIComponent(sizeSelected)
    }

    // XOR here, if both are yes they cancel out, if both are no
    // we do no filtering
    if (noRequiredApplication !== requiredApplication) {
      if (noRequiredApplication) {
        url += '&application_required__in=1'
      } else {
        url += '&application_required__in=2,3'
      }
    }

    if (acceptingMembers) {
      url += '&accepting_members=true'
    }

    doApiRequest(url, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((displayClubs) => {
        this.setState({ displayClubs, nameInput, selectedTags })
      })
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
      (tag) => tag.value === value && tag.name === name,
    )

    if (i === -1) {
      tag.name = name
      selectedTags.push(tag)
    } else {
      selectedTags.splice(i, 1)
    }

    this.setState({ selectedTags }, () =>
      this.resetDisplay(this.state.nameInput, this.state.selectedTags),
    )
  }

  shuffle() {
    const { userInfo } = this.props
    const { clubs } = this.state

    let userSchools = new Set()
    let userMajors = new Set()

    if (userInfo) {
      userSchools = new Set(userInfo.school.map((a) => a.name))
      userMajors = new Set(userInfo.major.map((a) => a.name))
    }
    clubs.forEach((club) => {
      club.rank = 0
      const hasSchool = club.target_schools.some(({ name }) =>
        userSchools.has(name),
      )
      const hasMajor = club.target_majors.some(({ name }) =>
        userMajors.has(name),
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
        if (typeof b.rank === 'undefined') {
          return -1
        }
        if (typeof a.rank === 'undefined') {
          return 1
        }

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
      clubLoaded,
      clubCount,
      displayClubs,
      display,
      selectedTags,
      nameInput,
    } = this.state
    const { tags } = this.props
    return (
      <>
        <Metadata />
        <div style={{ backgroundColor: SNOW }}>
          <SearchBar
            tags={tags}
            resetDisplay={this.resetDisplay.bind(this)}
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
                  {selectedTags.map((tag) => (
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
                      this.setState({ selectedTags: [] }, () =>
                        this.resetDisplay(nameInput, []),
                      )
                    }
                  >
                    Clear All
                  </ClearAllLink>
                </div>
              ) : (
                  ''
                )}

              <ListRenewalDialog />

              <ClubDisplay
                displayClubs={displayClubs}
                display={display}
                tags={tags}
              />
            </WideContainer>
          </Container>
        </div>
      </>
    )
  }
}

export default renderListPage(Splash)
