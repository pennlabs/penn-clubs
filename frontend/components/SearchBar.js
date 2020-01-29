import { useEffect, useRef, useState } from 'react'
import s from 'styled-components'

import { Icon } from './common'
import DropdownFilter, { CloseButton } from './DropdownFilter'
import {
  BORDER_RADIUS,
  mediaMaxWidth,
  MD,
  NAV_HEIGHT,
  mediaMinWidth,
  SEARCH_BAR_MOBILE_HEIGHT,
} from '../constants/measurements'
import {
  ALLBIRDS_GRAY,
  MEDIUM_GRAY,
  FOCUS_GRAY,
  CLUBS_GREY,
  BORDER,
  WHITE,
} from '../constants/colors'

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
    position: relative;
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

const SearchBar = ({
  tags,
  updateTag,
  selectedTags: propTags,
  resetDisplay,
}) => {
  const [nameInput, setNameInput] = useState('')
  const [activeDropdownFilter, setActiveDropdownFilter] = useState(null)
  const [selectedTags, setSelectedTags] = useState(propTags)
  const [timeout, storeTimeout] = useState(null)
  const inputRef = useRef()

  useEffect(() => setSelectedTags(propTags), [propTags])
  useEffect(() => {
    clearTimeout(timeout)
    storeTimeout(setTimeout(() => resetDisplay(nameInput, selectedTags), 200))
  }, [nameInput])

  const toggleActiveDropdownFilter = name =>
    setActiveDropdownFilter(activeDropdownFilter === name ? null : name)
  const closeDropdownFilter = () => setActiveDropdownFilter(null)
  const focus = () => inputRef.current.focus()

  const isTextInSearchBar = Boolean(nameInput)
  const dropdowns = {
    Type: tags.map(tag => ({
      value: tag.id,
      label: tag.name,
      count: tag.clubs,
    })),
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
              onChange={e => setNameInput(e.target.value)}
            />
          </SearchWrapper>
          {Object.keys(dropdowns).map(key => (
            <DropdownFilter
              active={activeDropdownFilter === key}
              toggleActive={() => toggleActiveDropdownFilter(key)}
              name={key}
              key={key}
              options={dropdowns[key]}
              selected={selectedTags.filter(tag => tag.name === key)}
              updateTag={updateTag}
            />
          ))}
          {activeDropdownFilter && (
            <CloseButton onClick={closeDropdownFilter} />
          )}
        </Content>
      </Wrapper>

      <MobileSearchBarSpacer />
    </>
  )
}

export default SearchBar
