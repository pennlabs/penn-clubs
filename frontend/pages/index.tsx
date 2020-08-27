import equal from 'deep-equal'
import { ReactElement, useEffect, useRef, useState } from 'react'
import s from 'styled-components'

import ListRenewalDialog from '../components/ClubPage/ListRenewalDialog'
import LiveEventsDialog from '../components/ClubPage/LiveEventsDialog'
import { Metadata, Title, WideContainer } from '../components/common'
import DisplayButtons from '../components/DisplayButtons'
import PaginatedClubDisplay from '../components/PaginatedClubDisplay'
import SearchBar, { SearchInput } from '../components/SearchBar'
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
import { PaginatedClubPage, renderListPage } from '../renderPage'
import { Tag, UserInfo } from '../types'
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
  clubs: PaginatedClubPage
  tags: Tag[]
  clubCount: number
  liveEventCount: number
}

const Splash = (props: SplashProps): ReactElement => {
  const currentSearch = useRef<SearchInput>({
    nameInput: '',
    selectedTags: [],
    order: '',
  })

  const [clubs, setClubs] = useState<PaginatedClubPage>(props.clubs)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<SearchInput>({
    nameInput: '',
    selectedTags: [],
    order: '',
  })
  const [display, setDisplay] = useState<'cards' | 'list'>('cards')

  useEffect((): void => {
    const { nameInput, selectedTags, order } = searchInput

    if (equal(searchInput, currentSearch.current)) {
      return
    }

    currentSearch.current = { ...searchInput }

    setLoading(true)

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

    const params = new URLSearchParams()
    params.set('format', 'json')
    params.set('page', '1')

    if (nameInput) {
      params.set('search', nameInput)
    }
    if (tagSelected.length > 0) {
      params.set('tags', tagSelected.join(','))
    }
    if (sizeSelected.length > 0) {
      params.set('size__in', sizeSelected.join(','))
    }

    if (order === 'random') {
      const seed = new Date().getTime()
      params.set('seed', seed.toString())
    }

    if (order.length > 0) {
      params.set('ordering', order)
    }

    // XOR here, if both are yes they cancel out, if both are no
    // we do no filtering
    if (noRequiredApplication !== requiredApplication) {
      if (noRequiredApplication) {
        params.set('application_required__in', '1')
      } else {
        params.set('application_required__in', '2,3')
      }
    }

    if (acceptingMembers) {
      params.set('accepting_members', 'true')
    }

    doApiRequest(`/clubs/?${params.toString()}`, {
      method: 'GET',
    })
      .then((res) => res.json())
      .then((displayClubs) => {
        if (equal(currentSearch.current, searchInput)) {
          setClubs(displayClubs)
          setLoading(false)
        }
      })
  }, [searchInput])

  return (
    <>
      <Metadata />
      <div style={{ backgroundColor: SNOW }}>
        <SearchBar
          tags={props.tags}
          updateSearch={setSearchInput}
          searchValue={searchInput}
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
              {clubs.count} result{clubs.count === 1 ? '' : 's'}
            </ResultsText>

            {!!searchInput.selectedTags.length && (
              <div style={{ padding: '0 30px 30px 0' }}>
                {searchInput.selectedTags.map((tag) => (
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
                      onClick={() =>
                        setSearchInput((inpt) => ({
                          ...inpt,
                          selectedTags: inpt.selectedTags.filter(
                            (oth) =>
                              !(
                                tag.name === oth.name && tag.value === oth.value
                              ),
                          ),
                        }))
                      }
                    />
                  </span>
                ))}
                <ClearAllLink
                  className="tag is-rounded"
                  onClick={() =>
                    setSearchInput((inpt) => ({ ...inpt, selectedTags: [] }))
                  }
                >
                  Clear All
                </ClearAllLink>
              </div>
            )}
            {false && props.liveEventCount > 0 && (
              <LiveEventsDialog liveEventCount={props.liveEventCount} />
            )}
            <ListRenewalDialog />

            {isLoading && (
              <progress className="progress is-small" max={100}>
                Loading...
              </progress>
            )}

            <PaginatedClubDisplay
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
