import React, {
  Children,
  ReactElement,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import s from 'styled-components'

import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_GREY,
  FOCUS_GRAY,
  H1_TEXT,
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
import { Icon } from './common'
import DropdownFilter, { FilterHeader, SelectableTag } from './DropdownFilter'
import FilterSearch, { FuseTag } from './FilterSearch'
import OrderInput from './OrderInput'

const MobileSearchBarSpacer = s.div`
  display: block;
  width: 100%;
  height: ${SEARCH_BAR_MOBILE_HEIGHT};

  ${mediaMinWidth(MD)} {
    display: none !important;
  }
`

export const SearchbarRightContainer = s.div`
  width: 80vw;
  margin-left: 20vw;
  padding: 0;

  ${mediaMaxWidth(MD)} {
    width: 100%;
    margin-left: 0;
  }
`

const Wrapper = s.div`
  height:100vh;
  width: 20vw;
  overflow-x: hidden;
  overflow-y: auto;
  position: fixed;
  top: 0;
  padding-top: ${NAV_HEIGHT};
  color: ${H1_TEXT};

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

type SearchBarProps = React.PropsWithChildren<{
  updateSearch: (modifier: SetStateAction<SearchInput>) => void
  searchInput: SearchInput
}>

type CollapsibleProps = React.PropsWithChildren<{
  active?: boolean
  name: string
}>

const Collapsible = ({
  children,
  active,
  name,
}: CollapsibleProps): ReactElement => {
  const [isActive, setActive] = useState<boolean>(active ?? true)

  return (
    <>
      <FilterHeader
        active={isActive}
        name={name}
        toggleActive={() => setActive((active) => !active)}
      />
      {isActive && children}
    </>
  )
}

export type SearchInput = {
  [key: string]: string
}

export type SearchTag = {
  name: string
  label: string
  value: string | number
}

const SearchBarContext = React.createContext<
  null | ((modifier: SetStateAction<SearchInput>) => void)
>(null)

const SearchBarValueContext = React.createContext<SearchInput>({})

type SearchBarTagItemProps = {
  param: string
  label: string
  options: FuseTag[]
}

type SearchBarTextItemProps = {
  param: string
}

type SearchBarOptionItemProps = {
  param: string
  label: string
}

type SearchBarCheckboxItemProps = {
  param: string
  label: string
  options: SearchTag[]
}

/**
 * Convert the comma separated string of tag values into a list of tag objects.
 */
function paramsToTags<T extends { value: string | number }>(
  params: string | null | undefined,
  tags: T[],
): T[] {
  const tagValues = (params ?? '')
    .trim()
    .split(',')
    .filter((val) => val.length > 0)

  return tagValues
    .map((val) => tags.find((tag) => tag.value.toString() === val))
    .filter((tag) => tag !== undefined) as T[]
}

/**
 * A item in the search bar that renders as a group of checkboxes.
 */
export const SearchBarCheckboxItem = ({
  param,
  label,
  options,
}: SearchBarCheckboxItemProps): ReactElement => {
  const searchCallback = useContext(SearchBarContext)
  if (searchCallback == null) {
    throw new Error('This component must be used inside a search bar!')
  }

  const searchValue = useContext(SearchBarValueContext)

  const [tags, setTags] = useState<SelectableTag[]>([])

  useEffect(() => {
    setTags(paramsToTags(searchValue[param], options))
  }, [searchValue])

  return (
    <Collapsible name={label} key={param}>
      <DropdownFilter
        name={param}
        options={options}
        selected={tags}
        updateTag={(tag) => {
          setTags((prev) => {
            const newArr = toggleItemInArray(
              tag,
              prev,
              (a, b) => a.value === b.value,
            )
            searchCallback(getCallback(param, newArr))
            return newArr
          })
        }}
      />
    </Collapsible>
  )
}

/**
 * A item in the search bar that renders as a single select dropdown menu.
 */
export const SearchBarOptionItem = ({
  param,
  label,
}: SearchBarOptionItemProps): ReactElement => {
  const searchCallback = useContext(SearchBarContext)
  if (searchCallback == null) {
    throw new Error('This component must be used inside a search bar!')
  }

  return (
    <Collapsible name={label}>
      <OrderInput
        onChange={(order: string) =>
          searchCallback((inpt) => ({
            ...inpt,
            [param]: order,
            seed: new Date().getTime().toString(),
          }))
        }
      />
    </Collapsible>
  )
}

/**
 * A item in the search bar that renders as a text input.
 */
export const SearchBarTextItem = ({
  param,
}: SearchBarTextItemProps): ReactElement => {
  const searchCallback = useContext(SearchBarContext)
  if (searchCallback == null) {
    throw new Error('This component must be used inside a search bar!')
  }

  const [nameInput, setNameInput] = useState<string>('')
  const [timeout, storeTimeout] = useState<number | null>(null)
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>

  useEffect(() => {
    timeout !== null && clearTimeout(timeout)
    storeTimeout(
      setTimeout(
        () => searchCallback((inpt) => ({ ...inpt, [param]: nameInput })),
        200,
      ),
    )
  }, [nameInput])

  const focus = () => inputRef.current && inputRef.current.focus()

  const isTextInSearchBar = Boolean(nameInput)
  return (
    <>
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
    </>
  )
}

function toggleItemInArray<T>(
  item: T,
  arr: T[],
  comparator: (a: T, b: T) => boolean,
): T[] {
  const newState = [...arr]
  const itemIndex = newState.findIndex((otherItem) =>
    comparator(item, otherItem),
  )
  if (itemIndex === -1) {
    newState.push(item)
  } else {
    newState.splice(itemIndex, 1)
  }
  return newState
}

const getCallback = (key: string, tags: SearchTag[]) => {
  const updateSearchState = (state) => {
    if (tags.length <= 0) {
      const newState = { ...state }
      if (key in newState) {
        delete newState[key]
      }
      return newState
    }
    return { ...state, [key]: tags.map((tag) => tag.value).join(',') }
  }

  return updateSearchState
}

/**
 * An item in the search bar that renders a multiselect of selectable tags.
 */
export const SearchBarTagItem = ({
  param,
  options,
  label,
}: SearchBarTagItemProps): ReactElement => {
  const searchCallback = useContext(SearchBarContext)
  if (searchCallback == null) {
    throw new Error('This component must be used inside a search bar!')
  }

  const searchValue = useContext(SearchBarValueContext)

  const [tags, setTags] = useState<FuseTag[]>([])

  useEffect(() => {
    setTags(paramsToTags(searchValue[param], options))
  }, [searchValue])

  const updateTag = (tag: FuseTag) => {
    const selectedTags = toggleItemInArray(
      tag,
      tags,
      (a, b) => a.value === b.value,
    )
    searchCallback(
      getCallback(
        param,
        selectedTags.map((tag) => {
          tag.name = label
          return tag
        }) as SearchTag[],
      ),
    )
  }

  return (
    <Collapsible name={label}>
      <FilterSearch
        name={label}
        tags={options}
        updateTag={updateTag}
        selected={tags}
        clearTags={() => {
          searchCallback(getCallback(param, []))
        }}
      />
    </Collapsible>
  )
}

/**
 * A search bar that returns a search query based on filtering on multiple attributes.
 */
const SearchBar = ({
  updateSearch,
  searchInput,
  children,
}: SearchBarProps): ReactElement => {
  return (
    <>
      <Wrapper>
        <Content>
          <SearchBarValueContext.Provider value={searchInput}>
            <SearchBarContext.Provider value={updateSearch}>
              {children}
            </SearchBarContext.Provider>
          </SearchBarValueContext.Provider>
        </Content>
      </Wrapper>

      <MobileSearchBarSpacer />
    </>
  )
}

export default SearchBar
