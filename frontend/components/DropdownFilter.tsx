import { ReactElement } from 'react'
import styled from 'styled-components'

import {
  BORDER,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_NAVY,
  CLUBS_RED,
  LIGHT_GRAY,
  PRIMARY_TAG_BG,
} from '../constants/colors'
import {
  ANIMATION_DURATION,
  MD,
  mediaMaxWidth,
} from '../constants/measurements'
import { logEvent } from '../utils/analytics'
import { Icon } from './common'

const checkboxColorMap = {
  Tags: PRIMARY_TAG_BG,
  Size: CLUBS_NAVY,
  Application: CLUBS_RED,
}

const Line = styled.hr`
  background-color: ${BORDER};
  height: 2px;
  margin: 0;
  margin-top: 30px;
  padding: 0;

  ${mediaMaxWidth(MD)} {
    display: none !important;
  }
`

const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 7px 3px;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    display: inline-flex;
    padding: 4px 8px;
    margin-right: 6px;
    border-radius: 16px;
    font-size: 80%;
    color: ${LIGHT_GRAY};
  }
`

const TableRow = styled.tr`
  padding-top: 3px;
  cursor: pointer;
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

const Chevron = styled(Icon)<{ open?: boolean }>`
  cursor: pointer;
  color: ${CLUBS_GREY};
  transform: rotate(0deg) translateY(0);
  transition: transform ${ANIMATION_DURATION}ms ease;
  ${({ open }) => open && 'transform: rotate(180deg) translateY(-4px);'}

  ${mediaMaxWidth(MD)} {
    margin-top: 0.1em !important;
    margin-left: 0.1em !important;
    color: ${LIGHT_GRAY};
    ${({ open }) => open && 'transform: rotate(180deg)'}
  }
`

const DropdownHeaderText = styled.p`
  opacity: 0.8;
  font-weight: 600;
  margin-bottom: 0;
`

type FilterHeaderProps = {
  active: boolean
  name: string
  toggleActive: () => void
}

// TODO: export out into separate component?
export const FilterHeader = ({
  active,
  name,
  toggleActive,
}: FilterHeaderProps): ReactElement => (
  <>
    <Line />
    <DropdownHeader onClick={() => toggleActive()}>
      <DropdownHeaderText>{name}</DropdownHeaderText>
      <Chevron
        name="chevron-down"
        alt="toggle dropdown"
        open={active}
        size="1rem"
      />
    </DropdownHeader>
  </>
)

export type SelectableTag = {
  value: number | string
  label: string
  name: string
  count?: number
}

type DropdownFilterProps = {
  name: string
  selected: SelectableTag[]
  options: SelectableTag[]
  updateTag: (tag: SelectableTag, name: string) => void
}

const DropdownFilter = ({
  selected,
  name,
  options,
  updateTag,
}: DropdownFilterProps): ReactElement => {
  /**
   * Returns if the supplied tag is in the list of selected tags
   *
   * @param {{value: string}} tag
   */
  const isSelected = (tag: SelectableTag): boolean => {
    const { value } = tag
    return Boolean(selected.find((tag) => tag.value === value))
  }

  const color = checkboxColorMap[name]

  return (
    <>
      <TableWrapper>
        <TableContainer>
          <table>
            <tbody>
              {options.map((tag: SelectableTag) => (
                <TableRow
                  key={tag.label}
                  onClick={() => {
                    logEvent('filter', name)
                    updateTag(tag, name)
                  }}
                >
                  <td
                    className="icon"
                    style={{
                      color: color || CLUBS_GREY_LIGHT,
                    }}
                  >
                    <Icon
                      style={{ transform: 'none', fill: color }}
                      name={isSelected(tag) ? 'check-box' : 'box'}
                      alt={isSelected(tag) ? 'selected' : 'not selected'}
                    />
                    &nbsp;
                  </td>
                  <td style={{ color: CLUBS_GREY_LIGHT }}>
                    <p style={{ marginBottom: '3px' }}>
                      {tag.label}
                      {typeof tag.count !== 'undefined' && (
                        <span className="has-text-grey"> ({tag.count})</span>
                      )}
                    </p>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableContainer>
      </TableWrapper>
    </>
  )
}

export default DropdownFilter
