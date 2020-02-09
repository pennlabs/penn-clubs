import { useState, useEffect } from 'react'
import s from 'styled-components'
import Select from 'react-select/async'
import fuzzysort from 'fuzzysort'

import { Icon } from './common'
import { FilterHeader } from './DropdownFilter'
import {
  mediaMaxWidth,
  MD,
  ANIMATION_DURATION,
} from '../constants/measurements'
import {
  MEDIUM_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY,
  FOCUS_GRAY,
  BORDER,
  WHITE,
} from '../constants/colors'

const SearchWrapper = s.div`
  margin-bottom: 30px;
  max-height: 0;
  opacity: 0;
  display: none;
  overflow: visible;
  transition: all ${ANIMATION_DURATION}ms ease;

  ${({ active }) =>
    active &&
    `
    max-height: 100%;
    opacity: 1;
    display: block;
  `}

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

const Search = ({ searchTags, recommendedTags, updateTag }) => {
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
  }

  return (
    <Select
      isMulti
      styles={styles}
      components={components}
      loadOptions={searchTags}
      defaultOptions={recommendedTags}
      cacheOptions
      onChange={(_, selectEvent) => {
        const { action, option } = selectEvent
        action === 'select-option' && updateTag(option, 'Tags')
      }}
      placeholder="Search for tags"
      value={null}
    />
  )
}

const selectRecommended = (tags = []) => {
  // Return 3 randomly selected tags by shuffling tags and then taking the first 3 tags
  const options = tags
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(tags.length, 3))
  return [
    {
      label: 'Suggested for you',
      options,
    },
  ]
}

const Filter = ({ active, toggleActive, tags, updateTag, selected }) => {
  const filter = new Set()
  selected.forEach(({ value }) => filter.add(value))
  tags = tags.filter(({ value }) => !filter.has(value))

  const [recommendedTags, setRecommendedTags] = useState(
    selectRecommended(tags)
  )
  const searchTags = async query => {
    const results = await fuzzysort.go(query, tags, {
      key: 'label',
      limit: 20,
      threshold: -10000,
    })
    return results.map(({ obj }) => obj)
  }

  useEffect(() => {
    setRecommendedTags(selectRecommended(tags))
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
          searchTags={searchTags}
          recommendedTags={recommendedTags}
          updateTag={updateTag}
        />
      </SearchWrapper>
    </>
  )
}

export default Filter
