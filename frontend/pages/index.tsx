import equal from 'deep-equal'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import s from 'styled-components'

import ListRenewalDialog from '../components/ClubPage/ListRenewalDialog'
import LiveEventsDialog from '../components/ClubPage/LiveEventsDialog'
import { Metadata, Title, WideContainer } from '../components/common'
import DisplayButtons from '../components/DisplayButtons'
import { FuseTag } from '../components/FilterSearch'
import PaginatedClubDisplay from '../components/PaginatedClubDisplay'
import SearchBar, {
  SearchBarCheckboxItem,
  SearchBarOptionItem,
  SearchbarRightContainer,
  SearchBarTagItem,
  SearchBarTextItem,
  SearchInput,
} from '../components/SearchBar'
import {
  CLUBS_GREY_LIGHT,
  CLUBS_NAVY,
  CLUBS_PURPLE,
  CLUBS_RED,
  FOCUS_GRAY,
  H1_TEXT,
  PRIMARY_TAG_BG,
  SNOW,
} from '../constants/colors'
import { PaginatedClubPage, renderListPage } from '../renderPage'
import { Badge, School, Tag, UserInfo, Year } from '../types'
import { doApiRequest, isClubFieldShown, useSetting } from '../utils'
import { OBJECT_NAME_TITLE, SITE_TAGLINE } from '../utils/branding'

const colorMap = {
  tags__in: PRIMARY_TAG_BG,
  size__in: CLUBS_NAVY,
  application_required__in: CLUBS_RED,
  badges__in: CLUBS_PURPLE,
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

type SplashProps = {
  userInfo: UserInfo
  clubs: PaginatedClubPage
  tags: Tag[]
  badges: Badge[]
  schools: School[]
  years: Year[]
  clubCount: number
  liveEventCount: number
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
        .filter((val) => val.length > 0)
        .map((value) =>
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
                key={tag.value}
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

const Splash = (props: SplashProps): ReactElement => {
  const fairIsOpen = useSetting('FAIR_OPEN')
  const preFair = useSetting('PRE_FAIR')
  const renewalBanner = useSetting('CLUB_REGISTRATION')
  const currentSearch = useRef<SearchInput>({})

  const [clubs, setClubs] = useState<PaginatedClubPage>(props.clubs)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<SearchInput>({})
  const [display, setDisplay] = useState<'cards' | 'list'>('cards')

  useEffect((): void => {
    if (equal(searchInput, currentSearch.current)) {
      return
    }

    currentSearch.current = { ...searchInput }

    setLoading(true)

    const params = new URLSearchParams()
    params.set('format', 'json')
    params.set('page', '1')

    Object.entries(searchInput).forEach(([key, value]) => {
      params.set(key, value)
    })

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

  return (
    <>
      <Metadata />
      <div style={{ backgroundColor: SNOW }}>
        <SearchBar updateSearch={setSearchInput} searchInput={searchInput}>
          <SearchBarTextItem param="search" />
          <SearchBarTagItem
            param="tags__in"
            label="Tags"
            options={tagOptions}
          />
          <SearchBarTagItem
            param="badges__in"
            label="Badges"
            options={badgeOptions}
          />
          <SearchBarOptionItem param="ordering" label="Ordering" />
          {isClubFieldShown('application_required') && (
            <SearchBarCheckboxItem
              param="application_required__in"
              label="General Membership Process"
              options={applicationRequiredOptions}
            />
          )}
          {isClubFieldShown('size') && (
            <SearchBarCheckboxItem
              param="size__in"
              label="Size"
              options={sizeOptions}
            />
          )}
          {isClubFieldShown('accepting_members') && (
            <SearchBarCheckboxItem
              param="accepting_members"
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
              param="appointment_needed__in"
              label="Appointment Needed"
              options={[
                { value: 'true', label: 'Yes', name: 'virtual' },
                { value: 'false', label: 'No', name: 'virtual' },
              ]}
            />
          )}
          <SearchBarCheckboxItem
            param="target_schools__in"
            label="School"
            options={props.schools.map(({ id, name }) => ({
              value: id,
              label: name,
              name: 'school',
            }))}
          />
          <SearchBarCheckboxItem
            param="target_years__in"
            label="School Year"
            options={props.years.map(({ id, name }) => ({
              value: id,
              label: name,
              name: 'year',
            }))}
          />
        </SearchBar>

        <SearchbarRightContainer>
          <WideContainer background={SNOW} fullHeight>
            <div style={{ padding: '30px 0' }}>
              <DisplayButtons switchDisplay={setDisplay} />

              <Title className="title" style={{ color: H1_TEXT }}>
                Browse {OBJECT_NAME_TITLE}
              </Title>
              <p
                className="subtitle is-size-5"
                style={{ color: CLUBS_GREY_LIGHT }}
              >
                {SITE_TAGLINE}
              </p>
            </div>
            <ResultsText>
              {' '}
              {clubs.count} result{clubs.count === 1 ? '' : 's'}
            </ResultsText>

            <SearchTags
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              optionMapping={{
                tags__in: tagOptions,
                badges__in: badgeOptions,
                application_required__in: applicationRequiredOptions,
                size__in: sizeOptions,
              }}
            />

            {(preFair || fairIsOpen) && (
              <LiveEventsDialog
                isPreFair={!!preFair}
                isFair={!!fairIsOpen}
                liveEventCount={props.liveEventCount}
              />
            )}
            {renewalBanner && <ListRenewalDialog />}

            {isLoading && <ListLoadIndicator />}

            <PaginatedClubDisplay
              displayClubs={clubs}
              display={display}
              tags={props.tags}
            />
          </WideContainer>
        </SearchbarRightContainer>
      </div>
    </>
  )
}

export default renderListPage(Splash)
