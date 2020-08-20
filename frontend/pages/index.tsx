import { ReactElement, useEffect, useRef, useState } from 'react'
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

type SplashProps = {
  userInfo: UserInfo
  clubs: Club[]
  tags: Tag[]
  clubCount: number
}

type SearchInput = {
  nameInput: string
  selectedTags: any[]
}

const Splash = (props: SplashProps): ReactElement => {
  const currentSearch = useRef<SearchInput | null>(null)

  const [clubs, setClubs] = useState<Club[]>(props.clubs)
  const [clubCount, setClubCount] = useState<number>(props.clubCount)
  const [selectedTags, setSelectedTags] = useState<any[]>([])
  const [nameInput, setNameInput] = useState<string>('')
  const [display, setDisplay] = useState<'cards' | 'list'>('cards')

  useEffect((): void => {
    currentSearch.current = { nameInput, selectedTags }

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
      url += '&tags=' + encodeURIComponent(tagSelected.join(','))
    }
    if (sizeSelected.length > 0) {
      url += '&size__in=' + encodeURIComponent(sizeSelected.join(','))
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
          currentSearch.current === null ||
          (currentSearch.current.nameInput === nameInput &&
            currentSearch.current.selectedTags === selectedTags)
        ) {
          setClubs(displayClubs)
          setClubCount(displayClubs.length)
        }
      })
  }, [nameInput, selectedTags])

  const updateTag = (tag, name) => {
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

    setSelectedTags([...selectedTags])
  }

  return (
    <>
      <Metadata />
      <div style={{ backgroundColor: SNOW }}>
        <SearchBar
          tags={props.tags}
          resetDisplay={(nameInput, selectedTags) => {
            setNameInput(nameInput)
            setSelectedTags(selectedTags)
          }}
          selectedTags={selectedTags}
          updateTag={updateTag}
        />

        <Container>
          <WideContainer background={SNOW}>
            <div style={{ padding: '30px 0' }}>
              <DisplayButtons switchDisplay={setDisplay} />

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
                      onClick={() => updateTag(tag, tag.name)}
                    />
                  </span>
                ))}
                <ClearAllLink
                  className="tag is-rounded"
                  onClick={() => setSelectedTags([])}
                >
                  Clear All
                </ClearAllLink>
              </div>
            )}

            <ListRenewalDialog />

            <ClubDisplay
              displayClubs={clubs}
              display={display}
              tags={props.tags}
            />
          </WideContainer>
        </Container>
      </div>
    </>
  )
}

export default renderListPage(Splash)
