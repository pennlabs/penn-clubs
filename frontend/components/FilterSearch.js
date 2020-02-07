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

const Filter = ({ active, toggleActive, tags, updateTag }) => {
    const [defaultTags] = useState(() => {
        const shuffled = tags.sort(() => 0.5 - Math.random());
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
              <Select
                isMulti
                cacheOptions
                loadOptions={searchTags}
                components={{
                  IndicatorSeparator: () => null,
                  DropdownIndicator: () => <SearchIcon><Icon name="tag" alt=""/></SearchIcon>,
                }}
                defaultOptions={defaultTags}
                onChange={(_, action) => {
                    action.option && updateTag(action.option, "Tags")
                }}
                value={[]}
                placeholder="Search for tags"
              />
            </SearchWrapper>
        </>
  )
}

export default Filter
