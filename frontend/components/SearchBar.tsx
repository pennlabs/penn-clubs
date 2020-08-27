import {
  ReactElement,
  SetStateAction,
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
import DropdownFilter, { FilterHeader } from './DropdownFilter'
import FilterSearch from './FilterSearch'
import OrderInput from './OrderInput'

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
  searchValue: SearchInput
  updateSearch: (modifier: SetStateAction<SearchInput>) => void
}

const DROPDOWNS = {
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
  nameInput: string
  order: string
  selectedTags: SearchTag[]
}

export type SearchTag = {
  name: string
  label: string
  value: string | number
}

const SearchBar = ({
  tags,
  searchValue,
  updateSearch,
}: SearchBarProps): ReactElement => {
  const { selectedTags } = searchValue

  const [nameInput, setNameInput] = useState<string>('')
  const [timeout, storeTimeout] = useState<number | null>(null)
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>

  const clearTags = (): void =>
    updateSearch((inpt) => ({
      ...inpt,
      selectedTags: inpt.selectedTags.filter((tag) => tag.name !== 'Tags'),
    }))

  const updateTag = (tag: SearchTag, name: string): void => {
    updateSearch((inpt) => {
      const selectedTags = [...inpt.selectedTags]

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

      return { ...inpt, selectedTags }
    })
  }

  useEffect(() => {
    timeout !== null && clearTimeout(timeout)
    storeTimeout(
      setTimeout(() => updateSearch((inpt) => ({ ...inpt, nameInput })), 200),
    )
  }, [nameInput])

  const focus = () => inputRef.current && inputRef.current.focus()

  const isTextInSearchBar = Boolean(nameInput)
  const relabeledTags = tags.map(({ id, name, clubs }) => ({
    value: id,
    label: name,
    count: clubs,
  }))

  const initialActive =
    typeof window !== 'undefined' ? window.innerWidth >= 1047 : true

  const searchFilters = [
    {
      key: 'text',
      content: () => {
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
      },
    },
    {
      key: 'tags',
      content: () => {
        return (
          <Collapsible name="Tags" active={initialActive}>
            <FilterSearch
              tags={relabeledTags}
              updateTag={updateTag}
              selected={selectedTags.filter((tag) => tag.name === 'Tags')}
              clearTags={clearTags}
            />
          </Collapsible>
        )
      },
    },
    {
      key: 'ordering',
      content: () => {
        return (
          <Collapsible name="Ordering" active={initialActive}>
            <OrderInput
              onChange={(order) => updateSearch((inpt) => ({ ...inpt, order }))}
            />
          </Collapsible>
        )
      },
    },
  ]

  Object.keys(DROPDOWNS).map((key) =>
    searchFilters.push({
      key,
      content: () => {
        return (
          <Collapsible name={key} key={key} active={initialActive}>
            <DropdownFilter
              name={key}
              options={DROPDOWNS[key]}
              selected={selectedTags.filter((tag) => tag.name === key)}
              updateTag={updateTag}
            />
          </Collapsible>
        )
      },
    }),
  )

  return (
    <>
      <Wrapper>
        <Content>
          {searchFilters.map(({ key, content }) => (
            <div key={key}>{content()}</div>
          ))}
        </Content>
      </Wrapper>

      <MobileSearchBarSpacer />
    </>
  )
}

export default SearchBar
