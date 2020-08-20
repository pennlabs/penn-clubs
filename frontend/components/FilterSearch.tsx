import Fuse from 'fuse.js'
import { ReactElement, useEffect, useState } from 'react'
import Select from 'react-select/async'
import s from 'styled-components'

import {
  BORDER,
  CLUBS_GREY,
  FOCUS_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../constants/colors'
import { MD, mediaMaxWidth } from '../constants/measurements'
import { Icon, SelectedTag } from './common'

const SearchWrapper = s.div`
  margin-bottom: 30px;
  overflow: visible;

  ${mediaMaxWidth(MD)} {
    height: auto;
    overflow: visible;
    width: 100%;
    margin: 0;
    padding: 8px 1rem;
    border-bottom: 1px solid ${BORDER};
    position: fixed;
    left: 0;
    z-index: 1000;
    background: ${WHITE};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.075);
  }
`

const SearchIcon = s(Icon)`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.5;
  margin-right: 6px !important;

  ${mediaMaxWidth(MD)} {
    right: 24px;
  }
`

type SearchProps = {
  selected: FuseTag[]
  searchTags: (query: string) => Promise<any[]>
  recommendedTags: { label: string; options: FuseTag[] }[]
  updateTag: (tag: FuseTag, name: string) => void
  clearTags: () => void
}

const Search = ({
  selected = [],
  searchTags,
  recommendedTags,
  updateTag,
  clearTags,
}: SearchProps): ReactElement => {
  // Custom styles for the react-select
  const styles = {
    control: ({ background, ...base }, { isFocused, isSelected }) => {
      const isEmphasized = isFocused || isSelected
      return {
        ...base,
        border: `1px solid ${BORDER}`,
        background: isEmphasized ? FOCUS_GRAY : background,
        boxShadow: 'none',
        '&:hover': {
          background: FOCUS_GRAY,
        },
      }
    },
    option: ({ background, ...base }, { isFocused, isSelected }) => {
      const isEmphasized = isFocused || isSelected
      return {
        ...base,
        background: isEmphasized ? FOCUS_GRAY : background,
        color: CLUBS_GREY,
      }
    },
  }

  // Overriding specific components of the react-select
  const components = {
    IndicatorSeparator: () => null,
    DropdownIndicator: () => <SearchIcon name="tag" alt="" />,
    MultiValueContainer: ({ innerProps, children }) => {
      return (
        <SelectedTag {...innerProps} className="tag is-rounded has-text-white">
          {children}
        </SelectedTag>
      )
    },
    MultiValueLabel: ({ data: { label } }) => label,
    MultiValueRemove: ({
      data,
      innerProps: { onClick, onTouchEnd, onMouseDown },
    }) => {
      const removeGenerator = (func) => {
        return (e) => {
          func(e)
          updateTag(data, 'Tags')
        }
      }
      return (
        <button
          className="delete is-small"
          onClick={removeGenerator(onClick)}
          onTouchEnd={removeGenerator(onTouchEnd)}
          onMouseDown={removeGenerator(onMouseDown)}
        />
      )
    },
  }
  return (
    <Select
      instanceId="club-search"
      isMulti
      cacheOptions
      styles={styles}
      components={components}
      loadOptions={searchTags}
      defaultOptions={recommendedTags}
      value={selected}
      backspaceRemovesValue
      onChange={(_, selectEvent): void => {
        const { action, option, removedValue } = selectEvent
        if (action === 'select-option') {
          updateTag(option, 'Tags')
        } else if (action === 'pop-value') {
          updateTag(removedValue, 'Tags')
        } else if (action === 'clear') {
          clearTags()
        }
      }}
      placeholder="Search for tags"
    />
  )
}

const selectInitial = (tags: FuseTag[] = []) => {
  return [
    {
      label: 'All tags',
      options: tags,
    },
  ]
}

type FuseTag = {
  value: number | string
  label: string
  count?: number
  name?: string
}

type FilterProps = {
  tags: FuseTag[]
  updateTag: (tag: FuseTag, name: string) => void
  selected: FuseTag[]
  clearTags: () => void
}

const Filter = ({
  tags,
  updateTag,
  clearTags,
  selected,
}: FilterProps): ReactElement => {
  const filter = new Set()
  selected.forEach(({ value }) => filter.add(value))
  tags = tags
    .filter(({ value }) => !filter.has(value))
    .map(({ label, count, ...tag }) => ({
      ...tag,
      label: `${label} (${count})`,
    }))
  const fuseOptions = {
    keys: ['label'],
    tokenize: true,
    findAllMatches: true,
    shouldSort: true,
    minMatchCharLength: 2,
    threshold: 0.2,
  }
  const fuse = new Fuse<FuseTag>(tags, fuseOptions)

  const [recommendedTags, setRecommendedTags] = useState(selectInitial(tags))
  const searchTags = async (query: string) => fuse.search(query)

  useEffect(() => {
    setRecommendedTags(selectInitial(tags))
  }, [selected])

  return (
    <>
      <SearchWrapper>
        <Search
          selected={selected}
          searchTags={searchTags}
          recommendedTags={recommendedTags}
          updateTag={updateTag}
          clearTags={clearTags}
        />
      </SearchWrapper>
    </>
  )
}

export default Filter
