import Fuse from 'fuse.js'
import { useEffect, useState } from 'react'
import Select from 'react-select/async'
import s from 'styled-components'

import {
  BORDER,
  CLUBS_BLUE,
  CLUBS_GREY,
  FOCUS_GRAY,
  MEDIUM_GRAY,
  WHITE,
} from '../constants/colors'
import {
  ANIMATION_DURATION,
  MD,
  mediaMaxWidth,
} from '../constants/measurements'
import { Icon, SelectedTag } from './common'
import { FilterHeader } from './DropdownFilter'

const SearchWrapper = s.div`
  margin-bottom: 30px;
  max-height: 0;
  opacity: 0;
  display: none;
  overflow: visible;
  transition: all ${ANIMATION_DURATION}ms ease;

  ${({ active }) => active && 'max-height: 100%; opacity: 1; display: block;'}

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

const Search = ({ selected = [], searchTags, recommendedTags, updateTag }) => {
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
      const removeGenerator = func => {
        return e => {
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
      isMulti
      cacheOptions
      styles={styles}
      components={components}
      loadOptions={searchTags}
      defaultOptions={recommendedTags}
      value={selected}
      backspaceRemovesValue
      onChange={(_, selectEvent) => {
        const { action, option, removedValue } = selectEvent
        if (action === 'select-option') {
          updateTag(option, 'Tags')
        } else if (action === 'pop-value') {
          updateTag(removedValue, 'Tags')
        }
      }}
      placeholder="Search for tags"
    />
  )
}

const selectInitial = (tags = []) => {
  return [
    {
      label: 'All tags',
      options: tags,
    },
  ]
}

const Filter = ({ active, toggleActive, tags, updateTag, selected }) => {
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
  const fuse = new Fuse(tags, fuseOptions)

  const [recommendedTags, setRecommendedTags] = useState(selectInitial(tags))
  const searchTags = async query => fuse.search(query)

  useEffect(() => {
    setRecommendedTags(selectInitial(tags))
  }, [selected])

  return (
    <>
      <FilterHeader
        active={active}
        color={CLUBS_BLUE}
        name="Tags"
        toggleActive={toggleActive}
      />
      <SearchWrapper active={active}>
        <Search
          selected={selected}
          searchTags={searchTags}
          recommendedTags={recommendedTags}
          updateTag={updateTag}
        />
      </SearchWrapper>
    </>
  )
}

export default Filter
