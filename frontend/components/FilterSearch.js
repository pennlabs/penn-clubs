import { useState, useRef, useEffect } from 'react'
import s from 'styled-components'
import Select from 'react-select'

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
  overflow: hidden;
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

{/* <SearchIcon>
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
                  <Icon name="tag" alt="" onClick={focus} />
                )}
              </SearchIcon> */}

const Filter = ({ active, toggleActive, tags }) => {
    const [nameInput, setNameInput] = useState('')
    const isTextInSearchBar = Boolean(nameInput)
    console.log(tags)
    const options = [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
      ]
      
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
                    components={{
                        IndicatorSeparator: () => null,
                        DropdownIndicator: () => <SearchIcon><Icon name="tag" alt=""/></SearchIcon>
                    }}
                    options={[options]}
                />
            </SearchWrapper>
        </>
    )
}

export default Filter
