import { useState, useRef, useEffect } from 'react'
import s from 'styled-components'
import Select from 'react-select/async'

import { Icon } from './common'
import { FilterHeader } from './DropdownFilter'
import {
  BORDER_RADIUS,
  mediaMaxWidth,
  MD,
  NAV_HEIGHT,
  mediaMinWidth,
  SEARCH_BAR_MOBILE_HEIGHT,
  ANIMATION_DURATION,
} from '../constants/measurements'
import {
  ALLBIRDS_GRAY,
  MEDIUM_GRAY,
  FOCUS_GRAY,
  CLUBS_GREY,
  BORDER,
  WHITE,
  CLUBS_RED,
} from '../constants/colors'

const SearchWrapper = s.div`
  margin-bottom: 30px;
  max-height: 0;
  opacity: 0;
  overflow: visible;
  transition: all ${ANIMATION_DURATION}ms ease;

  ${({ active }) => active && 'max-height: 150vh; opacity: 1;'}

  ${mediaMaxWidth(MD)} {
    margin-bottom: 8px;
  }
`

const SearchIcon = s.span`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
  opacity: 0.5;
  margin-right: 6px;

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
        border: `1px solid ${ALLBIRDS_GRAY}`,
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
    DropdownIndicator: () => <SearchIcon><Icon name="tag" alt="" /></SearchIcon>,
  }

  return <Select
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
}
        return [{
            label: "Suggested for you",
            options: shuffled.slice(0, Math.min(shuffled.length, 3))
        }]
    })
    const searchTags = async query => {
        // TODO: actually search tags
        return tags;
    }
  return (
        <>
            <FilterHeader
              active={active}
              color={CLUBS_RED}
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
