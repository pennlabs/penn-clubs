import { CLUB_RECRUITMENT_CYCLES } from 'components/ClubEditPage/ClubEditCard'
import ListRenewalDialog from 'components/ClubPage/ListRenewalDialog'
import { LiveEventsDialog } from 'components/ClubPage/LiveEventsDialog'
import { Icon, Metadata, Title, WideContainer } from 'components/common'
import DisplayButtons from 'components/DisplayButtons'
import { FuseTag } from 'components/FilterSearch'
import { ActionLink } from 'components/Header/Feedback'
import PaginatedClubDisplay from 'components/PaginatedClubDisplay'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchBarOptionItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from 'components/SearchBar'
import equal from 'deep-equal'
import {
  createContext,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { PaginatedClubPage, renderListPage } from 'renderPage'
import styled from 'styled-components'
import { Badge, Maybe, School, StudentType, Tag, UserInfo, Year } from 'types'
import { doApiRequest, doBulkLookup, isClubFieldShown, useSetting } from 'utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_TITLE,
  SHOW_SEARCHBAR_TOP,
  SITE_ID,
  SITE_TAGLINE,
} from 'utils/branding'

import { mediaMaxWidth, PHONE } from '~/constants'
import {
  BLACK,
  CLUBS_BLUE,
  CLUBS_GREY_LIGHT,
  CLUBS_PURPLE,
  FOCUS_GRAY,
  TAG_BACKGROUND_COLOR_MAP,
  TAG_TEXT_COLOR_MAP,
  WHITE,
} from '~/constants/colors'

const ClearAllLink = styled.span`
  cursor: pointer;
  color: ${CLUBS_GREY_LIGHT};
  text-decoration: none !important;
  background: transparent !important;
  fontsize: 0.7em;
  margin: 5px;

  &:hover {
    background: ${FOCUS_GRAY} !important;
  }
`

const ResultsText = styled.div`
  color: white;
  text-decoration: none !important;
  background: transparent !important;
  fontsize: 0.7em;
  margin: 5px;

  ${mediaMaxWidth(PHONE)} {
    margin-bottom: 1rem;
  }
`

const Divider = styled.div`
  width: 100%;
  height: 3px;
  margin-bottom: 1.5rem;
  border-radius: 1.5px;
  background: #000f3a;
`

type SplashProps = {
  userInfo: UserInfo
  clubs: PaginatedClubPage
  tags: Tag[]
  badges: Badge[]
  schools: School[]
  years: Year[]
  studentTypes: StudentType[]
  clubCount: number
}

export const ListLoadIndicator = (): ReactElement => {
  return (
    <progress className="progress is-small" max={100}>
      Loading...
    </progress>
  )
}

const SearchTags = ({
  searchInput,
  setSearchInput,
  optionMapping,
}): ReactElement => {
  const tags = Object.keys(optionMapping)
    .map((param) => {
      return (searchInput[param] ?? '')
        .trim()
        .split(',')
        .filter((val: string): boolean => val.length > 0)
        .map((value: string) =>
          optionMapping[param].find((tag) => tag.value.toString() === value),
        )
        .filter((tag) => tag !== undefined)
        .map((tag) => {
          tag.name = param
          return tag
        })
    })
    .flat()

  return (
    <>
      {!!tags.length && (
        <div style={{ padding: '0 30px 30px 0' }}>
          {tags.map((tag) => {
            return (
              <span
                key={`${tag.value} ${tag.label}`}
                className="tag is-rounded"
                style={{
                  color: TAG_TEXT_COLOR_MAP[tag.name] ?? 'white',
                  backgroundColor:
                    TAG_BACKGROUND_COLOR_MAP[tag.name] ?? CLUBS_PURPLE,
                  fontWeight: 600,
                  margin: 3,
                }}
              >
                {tag.label}
                <button
                  className="delete is-small"
                  onClick={() => {
                    const newTags = searchInput[tag.name]
                      .split(',')
                      .filter((t) => t.value === tag.value)
                      .join(',')
                    if (newTags.length > 0) {
                      setSearchInput((inpt) => ({
                        ...inpt,
                        [tag.name]: newTags,
                      }))
                    } else {
                      setSearchInput((inpt) => {
                        const newInpt = { ...inpt }
                        delete newInpt[tag.name]
                        return newInpt
                      })
                    }
                  }}
                />
              </span>
            )
          })}
          <ClearAllLink
            className="tag is-rounded"
            onClick={() =>
              setSearchInput((inpt) => {
                const newInpt = { ...inpt }
                Object.keys(newInpt)
                  .filter((param) => param in optionMapping)
                  .forEach((key) => {
                    if (key in newInpt) {
                      delete newInpt[key]
                    }
                  })
                return newInpt
              })
            }
          >
            Clear All
          </ClearAllLink>
        </div>
      )}
    </>
  )
}

/**
 * The top bar search input, used for Hub@Penn.
 */
const TopSearchBar = ({ onChange }): ReactElement => {
  const searchTimeout = useRef<number | null>(null)
  const [searchValue, setSearchValue] = useState<string>('')

  const updateSearchValue = (value: string): void => {
    if (searchTimeout.current != null) {
      window.clearTimeout(searchTimeout.current)
    }
    setSearchValue(value)
    searchTimeout.current = window.setTimeout(() => {
      searchTimeout.current = null
      onChange(value)
    }, 100)
  }

  return (
    <div className="control has-icons-right">
      <input
        className="input mb-5"
        placeholder={`Search for ${OBJECT_NAME_PLURAL}...`}
        value={searchValue}
        onChange={(e) => updateSearchValue(e.target.value)}
      />
      {searchValue.length > 0 && (
        <span
          className="icon is-small is-right"
          onClick={() => {
            setSearchValue('')
            onChange('')
          }}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Icon name="x" />
        </span>
      )}
    </div>
  )
}

/**
 * A scroll to top button at the bottom right corner of the page.
 */
const ScrollTopButton = (): ReactElement | null => {
  const [isTop, setIsTop] = useState<boolean>(true)

  useEffect(() => {
    const onScroll = () => {
      const nowTop = window.scrollY < 300
      setIsTop(nowTop)
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (isTop) {
    return null
  }

  return (
    <ActionLink
      offsetAddition={55}
      onClick={(e) => {
        e.preventDefault()
        window.scrollTo(0, 0)
      }}
      title="Scroll to Top"
    >
      <Icon name="chevron-up" size="1.5rem" />
    </ActionLink>
  )
}

type UpdateClubContext = (
  code: string,
  key: 'bookmark' | 'subscribe', // POLP inspired. We may want to add keys here
  value: boolean,
) => void

export const UpdateClubContext = createContext<UpdateClubContext>(() => null)

const searchIsEmpty = (input: SearchInput): boolean => {
  const { search, ...rest } = input
  return (!search || !search.length) && !Object.entries(rest).length
}

const Splash = (props: SplashProps): ReactElement => {
  const fairIsOpen = useSetting('FAIR_OPEN')
  const preFair = useSetting('PRE_FAIR')
  const renewalBanner = useSetting('CLUB_REGISTRATION')
  const currentSearch = useRef<SearchInput>({})

  const [clubs, setClubs] = useState<PaginatedClubPage>(props.clubs)
  const updateClub = (code, key, value) => {
    setClubs({
      ...clubs,
      results: clubs.results.map((club) => {
        if (club.code === code) {
          if (key === 'bookmark') {
            club.is_favorite = value
          } else if (key === 'subscribe') {
            club.is_subscribe = value
          }
        }
        return { ...club }
      }),
    })
  }
  const [exclusiveClubs, setExclusiveClubs] = useState<
    Maybe<PaginatedClubPage>
  >()

  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<SearchInput>({})
  const [display, setDisplay] = useState<'cards' | 'list'>('cards')

  useEffect((): void => {
    if (equal(searchInput, currentSearch.current)) {
      return
    }
    currentSearch.current = { ...searchInput }
    setLoading(true)

    const paramsObject = {
      format: 'json',
      page: '1',
      ...searchInput,
    }

    ;(async () => {
      if (SITE_ID === 'fyh' && !searchIsEmpty(currentSearch.current)) {
        // general is basically everything (including the search result)
        const generalParams = new URLSearchParams({
          format: 'json',
          page: '1',
          viewType: 'general',
        })
        const exclusiveParams = new URLSearchParams({
          ...paramsObject,
          viewType: 'exclusive',
        })
        const results = await doBulkLookup([
          ['general', `/clubs/?${generalParams.toString()}`],
          ['exclusive', `/clubs/?${exclusiveParams.toString()}`],
        ])
        if (equal(currentSearch.current, searchInput)) {
          setClubs(results.general)
          setExclusiveClubs(results.exclusive)
          setLoading(false)
        }
      } else {
        const params = new URLSearchParams(paramsObject)
        const displayClubs = await doApiRequest(
          `/clubs/?${params.toString()}`,
          {
            method: 'GET',
          },
        ).then((res) => res.json())
        if (equal(currentSearch.current, searchInput)) {
          setClubs(displayClubs)
          setExclusiveClubs(undefined)
          setLoading(false)
        }
      }
    })()
  }, [searchInput])

  const tagOptions = useMemo<FuseTag[]>(
    () =>
      props.tags.map(({ id, name, clubs }) => ({
        value: id,
        label: name,
        count: clubs,
      })),
    [props.tags],
  )

  const badgeOptions = useMemo<FuseTag[]>(
    () =>
      props.badges.map(({ id, label, color, description }) => ({
        value: id,
        label,
        color,
        description,
      })),
    [props.badges],
  )

  const applicationRequiredOptions = [
    { value: 1, label: 'Open Membership', name: 'app' },
    {
      value: 2,
      label: 'Tryout Required',
      name: 'app',
    },
    {
      value: 3,
      label: 'Audition Required',
      name: 'app',
    },
    {
      value: 4,
      label: 'Application Required',
      name: 'app',
    },
    {
      value: 5,
      label: 'Application and Interview Required',
      name: 'app',
    },
  ]

  const sizeOptions = [
    { value: 1, label: 'less than 20 members', name: 'size' },
    { value: 2, label: '20 to 50 members', name: 'size' },
    { value: 3, label: '50 to 100 members', name: 'size' },
    { value: 4, label: 'more than 100', name: 'size' },
  ]

  const schoolOptions = props.schools.map(({ id, name, is_graduate }) => ({
    value: id,
    label: name,
    name: 'school',
    color: is_graduate && SITE_ID === 'clubs' ? CLUBS_BLUE : undefined,
  }))

  const yearOptions = props.years.map(({ id, name }) => ({
    value: id,
    label: name,
    name: 'year',
  }))

  const studentTypeOptions = props.studentTypes.map(({ id, name }) => ({
    value: id,
    label: name,
    name: 'student_type',
  }))

  const recruitingCycleOptions = CLUB_RECRUITMENT_CYCLES.map((item) => ({
    ...item,
    name: 'cycle',
  }))

  return (
    <>
      <Metadata />
      <div style={{ backgroundColor: BLACK }}>
        <SearchBar updateSearch={setSearchInput} searchInput={searchInput}>
          {SHOW_SEARCHBAR_TOP || (
            <div className="mt-2">
              <SearchBarTextItem param="search" />
            </div>
          )}
          <SearchBarTagItem
            param="tags__in"
            label="Tags"
            options={tagOptions}
          />
          {isClubFieldShown('badges') && (
            <SearchBarTagItem
              param="badges__in"
              label="Badges"
              options={badgeOptions}
            />
          )}
          <SearchBarOptionItem param="ordering" label="Ordering" />
          {isClubFieldShown('application_required') && (
            <SearchBarCheckboxItem
              param="application_required__in"
              color={WHITE}
              label="General Membership Process"
              options={applicationRequiredOptions}
            />
          )}
          {isClubFieldShown('size') && (
            <SearchBarCheckboxItem
              param="size__in"
              color={WHITE}
              label="Size"
              options={sizeOptions}
            />
          )}
          {isClubFieldShown('accepting_members') && (
            <SearchBarCheckboxItem
              param="accepting_members"
              color={WHITE}
              label="Accepting Members"
              options={[
                {
                  value: 'true',
                  label: 'Is Accepting Members',
                  name: 'accept',
                },
              ]}
            />
          )}
          {isClubFieldShown('recruiting_cycle') && (
            <SearchBarCheckboxItem
              param="recruiting_cycle__in"
              color={WHITE}
              label="Recruiting Cycle"
              options={recruitingCycleOptions}
            />
          )}
          {isClubFieldShown('available_virtually') && (
            <SearchBarCheckboxItem
              param="available_virtually__in"
              label="Available Virtually"
              options={[
                { value: 'true', label: 'Yes', name: 'virtual' },
                { value: 'false', label: 'No', name: 'virtual' },
              ]}
            />
          )}
          {isClubFieldShown('appointment_needed') && (
            <SearchBarCheckboxItem
              color={WHITE}
              param="appointment_needed__in"
              label="Appointment Needed"
              options={[
                { value: 'true', label: 'Yes', name: 'virtual' },
                { value: 'false', label: 'No', name: 'virtual' },
              ]}
            />
          )}
          {isClubFieldShown('target_schools') &&
            (SITE_ID === 'fyh' ? (
              <SearchBarCheckboxItem
                param="target_schools__in"
                label="School Specific"
                options={schoolOptions}
              />
            ) : null)}
          {SITE_ID === 'fyh' ? (
            <SearchBarCheckboxItem
              param="target_years__in"
              label="School Year Specific"
              options={yearOptions}
            />
          ) : null}
          {isClubFieldShown('student_types') &&
            (SITE_ID === 'fyh' ? (
              <SearchBarCheckboxItem
                param="student_types__in"
                label="Student Type Specific"
                options={studentTypeOptions}
              />
            ) : (
              <SearchBarCheckboxItem
                param="student_types__in"
                label="Student Type"
                options={studentTypeOptions}
              />
            ))}
        </SearchBar>

        <SearchbarRightContainer>
          <WideContainer background={BLACK} fullHeight>
            <div style={{ padding: '30px 0' }}>
              <DisplayButtons switchDisplay={setDisplay} />

              <Title style={{ color: '#ffa31a' }}>
                Browse {OBJECT_NAME_TITLE}
              </Title>
              <p className="subtitle is-size-5" style={{ color: '#ffa31a' }}>
                {SITE_TAGLINE}
              </p>
            </div>
            {SHOW_SEARCHBAR_TOP && (
              <>
                <TopSearchBar
                  onChange={(value) =>
                    setSearchInput((inpt) => ({ ...inpt, search: value }))
                  }
                />
                <ScrollTopButton />
              </>
            )}
            <ResultsText>
              {' '}
              {exclusiveClubs ? (
                <>
                  {exclusiveClubs.count} result
                  {exclusiveClubs.count === 1 ? '' : 's'}
                </>
              ) : (
                <>
                  {clubs.count} result{clubs.count === 1 ? '' : 's'}
                </>
              )}
            </ResultsText>

            <SearchTags
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              optionMapping={{
                tags__in: tagOptions,
                badges__in: badgeOptions,
                application_required__in: applicationRequiredOptions,
                size__in: sizeOptions,
                target_schools__in: schoolOptions,
                target_years__in: yearOptions,
                student_types__in: studentTypeOptions,
                recruiting_cycle__in: recruitingCycleOptions,
              }}
            />

            {(preFair || fairIsOpen) && (
              <LiveEventsDialog isPreFair={!!preFair} isFair={!!fairIsOpen} />
            )}

            {renewalBanner && <ListRenewalDialog />}

            {isLoading && <ListLoadIndicator />}

            <UpdateClubContext.Provider value={updateClub}>
              {exclusiveClubs && (
                <>
                  {!!exclusiveClubs.count && (
                    <PaginatedClubDisplay
                      displayClubs={exclusiveClubs}
                      display={display}
                      tags={props.tags}
                    />
                  )}
                  <div style={{ marginBottom: '8px' }}>
                    Check out these additional resources that may interest you.
                  </div>
                  <Divider />
                </>
              )}

              <PaginatedClubDisplay
                displayClubs={clubs}
                display={display}
                tags={props.tags}
              />
            </UpdateClubContext.Provider>
          </WideContainer>
        </SearchbarRightContainer>
      </div>
    </>
  )
}

export default renderListPage(Splash)
