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
import { Club, Tag, UserInfo } from '../types'
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
  target_schools: any[]
  target_majors: any[]
  target_years: any[]
}

type SplashProps = {
  userInfo: UserInfo
  clubs: Club[]
  tags: Tag[]
}

type SplashState = {
  clubs: RankedClub[]
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

    this.switchDisplay = this.switchDisplay.bind(this)
  }

  resetDisplay(nameInput: string, selectedTags): void {
    this.setState({ nameInput, selectedTags })

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
        if (
          this.state.nameInput === nameInput &&
          this.state.selectedTags === selectedTags
        ) {
          this.setState({ displayClubs, clubCount: displayClubs.length })
        }
      })
  }

  switchDisplay(display: 'list' | 'cards'): void {
    logEvent('viewMode', display)
    this.setState({ display })
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

  render() {
    const {
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
                <DisplayButtons switchDisplay={this.switchDisplay} />

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
                {clubCount} result{clubCount === 1 ? '' : 's'}
              </ResultsText>

              {!!selectedTags.length && (
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
