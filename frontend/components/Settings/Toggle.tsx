// Modified from basics
import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_BLUE, LIGHT_GRAY, MEDIUM_GRAY } from '../../constants/colors'
const HEIGHT = 0.875
const WIDTH = 2.25

const Label = styled.span<{ $active?: boolean }>`
  display: inline-block;
  margin-bottom: 0;
  color: ${MEDIUM_GRAY};
  transition: all 0.2 ease;
  cursor: pointer;
  opacity: 0.6;
  ${({ $active }) =>
    $active &&
    `
    opacity: 1;
    color: ${CLUBS_BLUE} !important;
  `}
`

const ToggleWrapper = styled.div`
  width: ${WIDTH}rem;
  position: relative;
  display: inline-block;
  margin-left: 0.625rem;
  margin-right: 0.625em;
`

const Bar = styled.div<{ $active?: boolean }>`
  transition: all 0.2s ease;
  width: 100%;
  height: ${HEIGHT}rem;
  border-radius: ${HEIGHT}rem;
  margin-top: ${(1.4 - HEIGHT) / 2}rem;
  display: inline-block;
  cursor: pointer;
`

const Circle = styled.div<{ $active?: boolean }>`
  transition: all 0.2s ease;
  height: ${HEIGHT + 0.4}rem;
  width: ${HEIGHT + 0.4}rem;
  border-radius: 100%;
  margin-top: ${(1.4 - HEIGHT) / 2 - 0.2}rem;
  position: absolute;
  background: ${CLUBS_BLUE};
  margin-left: ${({ $active }) =>
    $active ? `${WIDTH - HEIGHT - 0.4}rem` : '0'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  cursor: pointer;
`

/**
 * @param {boolean} filter: filter in the redux
 * @param {string} filterOffText: text rendered when the filter is off
 * @param {string} filterOnText text rendered when filter is on
 */
const Toggle = <T,>({
  filterOffText,
  filterOnText,
  active,
  toggle,
  club,
}: ToggleProps<T>): ReactElement => {
  function handleClick(): void {
    toggle(club)
  }

  return (
    <div>
      <Label onClick={handleClick} $active>
        {filterOffText}
      </Label>
      <ToggleWrapper>
        <Circle
          style={{ background: active ? CLUBS_BLUE : MEDIUM_GRAY }}
          onClick={handleClick}
          $active={active}
        />
        <Bar
          style={{ background: active ? '#D3EBF3' : LIGHT_GRAY }}
          onClick={handleClick}
          $active={active}
        />
      </ToggleWrapper>
      <Label onClick={handleClick} $active>
        {filterOnText}
      </Label>
    </div>
  )
}

type ToggleProps<T> = {
  club: T
  toggle: (club: T) => void
  filter?: boolean
  filterOffText?: string
  filterOnText?: string
  active?: boolean
}

export default Toggle
