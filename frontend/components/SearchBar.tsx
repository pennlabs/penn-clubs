import { ReactElement, useEffect, useRef, useState } from 'react'
import s from 'styled-components'

import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_GREY,
  FOCUS_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../constants/colors'
import {
  BORDER_RADIUS,
  MD,
  mediaMaxWidth,
  mediaMinWidth,
  NAV_HEIGHT,
  SEARCH_BAR_MOBILE_HEIGHT,
} from '../constants/measurements'
import { BODY_FONT } from '../constants/styles'
import { Tag } from '../types'
import { Icon } from './common'
import DropdownFilter from './DropdownFilter'
import FilterSearch from './FilterSearch'

const MobileSearchBarSpacer = s.div`
  display: block;
  width: 100%;
  height: ${SEARCH_BAR_MOBILE_HEIGHT};

  ${mediaMinWidth(MD)} {
    display: none !important;
  }
`

const Wrapper = s.div`
  height: 100vh;
  width: 20vw;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  top: 0;
  padding-top: ${NAV_HEIGHT};

  ${mediaMaxWidth(MD)} {
    position: relative;
    height: auto;
    overflow: visible;
    padding-top: 0;
    width: 100%;
  }
`

const SearchWrapper = s.div`
  margin-bottom: 30px;

  ${mediaMaxWidth(MD)} {
    margin-bottom: 8px;
  }
`

const Content = s.div`
  padding: 36px 17px 12px 17px;
  width: 100%;

  &::-webkit-scrollbar {
    display: none;
  }

  ${mediaMaxWidth(MD)} {
    height: auto;
    overflow: visible;
    width: 100%;
    margin: 0;
    padding: 8px 1rem;
    border-bottom: 1px solid ${BORDER};
    position: fixed;
    z-index: 1000;
    background: ${WHITE};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.075);
  }
`

const Input = s.input`
  border: 1px solid ${ALLBIRDS_GRAY};
  outline: none;
  color: ${CLUBS_GREY};
  width: 100%;
  font-size: 1em;
  padding: 8px 10px;
  background: ${WHITE};
  border-radius: ${BORDER_RADIUS};
  font-family: ${BODY_FONT};

  &:hover,
  &:active,
  &:focus {
    background: ${FOCUS_GRAY};
  }
`

const SearchIcon = s.span`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.5;
  padding-top: 4px;
  position: absolute;
  right: 24px;

  ${mediaMaxWidth(MD)} {
    right: 24px;
  }
`

const MobileLine = s.hr`
  display: none;  
  ${mediaMaxWidth(MD)} {
    display: block;
    margin: 1.0em 0 0 0;
    border-color: ${CLUBS_GREY};
  }
`

type SearchBarProps = {
  tags: Tag[]
  updateTag: any
  selectedTags: Tag[]
  resetDisplay: (nameInput: string, selectedTags: Tag[]) => void
}

const SearchBar = ({
  tags,
  updateTag,
  selectedTags: propTags,
  resetDisplay,
}: SearchBarProps): ReactElement => {
  const [nameInput, setNameInput] = useState<string>('')
  const [activeDropdownFilter, setActiveDropdownFilter] = useState<
    string | null
  >(null)
  const [selectedTags, setSelectedTags] = useState(propTags)
  const [timeout, storeTimeout] = useState<number | null>(null)
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>

  useEffect(() => setSelectedTags(propTags), [propTags])
  useEffect(() => {
    timeout !== null && clearTimeout(timeout)
    storeTimeout(setTimeout(() => resetDisplay(nameInput, selectedTags), 200))
  }, [nameInput])

  const toggleActiveDropdownFilter = (name) =>
    setActiveDropdownFilter(activeDropdownFilter === name ? null : name)
  const focus = () => inputRef.current && inputRef.current.focus()

  const isTextInSearchBar = Boolean(nameInput)
  const relabeledTags = tags.map(({ id, name, clubs }) => ({
    value: id,
    label: name,
    count: clubs,
  }))
  const dropdowns = {
    Size: [
      { value: 1, label: 'less than 20 members' },
      { value: 2, label: '20 to 50 members' },
      { value: 3, label: '50 to 100 members' },
      { value: 4, label: 'more than 100' },
    ],
    Application: [
      { value: 1, label: 'Requires application' },
      { value: 2, label: 'Does not require application' },
      { value: 3, label: 'Currently accepting applications' },
    ],
  }

  return (
    <>
      <Wrapper>
        <Content>
          <SearchWrapper>
            <SearchIcon>
              {isTextInSearchBar ? (
                <Icon
                  name="x"
                  alt="cancel search"
                  onClick={() => {
                    setNameInput('')
                    focus()
                  }}
                />
              ) : (
                <Icon name="search" alt="search" onClick={focus} />
              )}
            </SearchIcon>
            <Input
              type="text"
              name="search"
              placeholder="Search"
              aria-label="Search"
              ref={inputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </SearchWrapper>
          <MobileLine />
          <FilterSearch
            active={activeDropdownFilter === 'Tags'}
            toggleActive={() => toggleActiveDropdownFilter('Tags')}
            tags={relabeledTags}
            updateTag={updateTag}
            selected={selectedTags.filter((tag) => tag.name === 'Tags')}
          />
          {Object.keys(dropdowns).map((key) => (
            <DropdownFilter
              active={activeDropdownFilter === key}
              toggleActive={() => toggleActiveDropdownFilter(key)}
              name={key}
              key={key}
              options={dropdowns[key]}
              selected={selectedTags.filter((tag) => tag.name === key)}
              updateTag={updateTag}
            />
          ))}
        </Content>
      </Wrapper>

      <MobileSearchBarSpacer />
    </>
  )
}

export default SearchBar
