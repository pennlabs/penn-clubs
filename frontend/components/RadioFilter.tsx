import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_GREY } from '../constants/colors'
import { MD, mediaMaxWidth } from '../constants/measurements'
import { logEvent } from '../utils/analytics'
import { SelectableTag } from './DropdownFilter'

const RadioRow = styled.div<{ $color?: string }>`
  padding-top: 3px;

  & label {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  & span {
    color: ${({ $color }) => $color ?? CLUBS_GREY};
  }

  & input[type='radio'] {
    margin: 0;
    cursor: pointer;
    appearance: none;
    width: 14px;
    height: 14px;
    box-sizing: border-box;
    border: 2px solid #000;
    border-radius: 50%;
    background-color: white;
    position: relative;
    flex-shrink: 0;
    outline: none;

    &:checked {
      background-color: #000;
      border-color: #000;
    }

    &:hover {
      opacity: 0.8;
    }
  }
`

const TableWrapper = styled.div`
  overflow: hidden;

  max-height: 150vh;
  opacity: 1;

  ${mediaMaxWidth(MD)} {
    width: 100%;
  }
`

const TableContainer = styled.div`
  ${mediaMaxWidth(MD)} {
    padding: 1rem;
  }
`

type RadioFilterProps = {
  name: string
  color?: string
  selected: SelectableTag[]
  options: (SelectableTag & { color?: string })[]
  updateTag: (tag: SelectableTag, name: string) => void
}

export const RadioFilter = ({
  selected,
  name,
  color,
  options,
  updateTag,
}: RadioFilterProps): ReactElement<any> => {
  /**
   * Returns if the supplied tag is in the list of selected tags
   *
   * @param {{value: string}} tag
   */
  const isSelected = (tag: SelectableTag): boolean => {
    const { value } = tag
    return Boolean(selected.find((tag) => tag.value === value))
  }

  return (
    <TableWrapper>
      <TableContainer>
        {options.map((tag: SelectableTag & { color?: string }) => (
          <RadioRow
            key={tag.label}
            $color={color}
            onClick={() => {
              logEvent('filter', name)
              updateTag(tag, name)
            }}
          >
            <label>
              <input
                type="radio"
                name={name}
                value={String(tag.value)}
                checked={isSelected(tag)}
                onChange={(e) => {
                  e.stopPropagation()
                  logEvent('filter', name)
                  updateTag(tag, name)
                }}
                aria-checked={isSelected(tag) ? 'true' : 'false'}
              />
              <span>
                <p>
                  {tag.label}
                  {typeof tag.count !== 'undefined' && (
                    <span className="has-text-grey"> ({tag.count})</span>
                  )}
                </p>
              </span>
            </label>
          </RadioRow>
        ))}
      </TableContainer>
    </TableWrapper>
  )
}

export default RadioFilter
