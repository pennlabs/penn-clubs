import { useState } from 'react'
import s from 'styled-components'
import {
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  CLUBS_BLUE,
  CLUBS_RED,
  CLUBS_YELLOW,
  BORDER,
  LIGHT_GRAY,
  WHITE,
} from '../constants/colors'
import {
  mediaMaxWidth,
  MD,
  SEARCH_BAR_MOBILE_HEIGHT,
  NAV_HEIGHT,
} from '../constants/measurements'
import { logEvent } from '../utils/analytics'
import { Icon } from './common'

// Helper map for getting icon posftix from icon name
const colorToColorNameMap = {
  [CLUBS_BLUE]: '-blue',
  [CLUBS_RED]: '-red',
  [CLUBS_YELLOW]: '-yellow',
}

const checkboxColorMap = {
  Type: CLUBS_BLUE,
  Size: CLUBS_RED,
  Application: CLUBS_YELLOW,
}

const Line = s.hr`
  background-color: rgba(0, 0, 0, .1);
  height: 2px;
  margin: 0;
  margin-top: 30px;
  padding: 0;

  ${mediaMaxWidth(MD)} {
    display: none !important;
  }
`

const DropdownHeader = s.div`
  display: flex;
  justify-content: space-between;
  padding: 7px 3px;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    display: inline-block;
    width: auto;
    border: 2px solid ${BORDER};
    padding: 4px 8px;
    margin-right: 6px;
    border-radius: 16px;
    font-size: 80%;
    color: ${LIGHT_GRAY};

    ${({ drop, color }) =>
      drop &&
      `
      background: ${color || CLUBS_YELLOW};
    `}
  }
`

const TableRow = s.tr`
  padding-top: 3px;
  cursor: pointer;
`

const TableWrapper = s.div`
  max-height: 0;
  opacity: 0;
  transition: all 0.2s ease;
  overflow: hidden;

  ${mediaMaxWidth(MD)} {
    position: fixed;
    left: 0;
    width: 100%;
    top: calc(${SEARCH_BAR_MOBILE_HEIGHT} + ${NAV_HEIGHT});
    background: ${WHITE};
    height: calc(100vh - ${SEARCH_BAR_MOBILE_HEIGHT} - ${NAV_HEIGHT});
  }

  ${({ drop }) =>
    drop &&
    `
    max-height: none;
    opacity: 1;
  `}
`

const TableContainer = s.div`
  ${mediaMaxWidth(MD)} {
    padding: 1rem;
  }
`

const ChevronIcon = s.span`
  cursor: pointer;
  color: ${CLUBS_GREY};

  ${mediaMaxWidth(MD)} {
    display: none !important;
  }
`

const DropdownHeaderText = s.p`
  opacity: 0.8;
  font-weight: 600;
  margin-bottom: 0;

  ${mediaMaxWidth(MD)} {
    color: rgba(0, 0, 0, 0.5);
    opacity: 1;
  }
`

const Chevron = () => (
  <ChevronIcon className="icon">
    <Icon name="chevron-down" alt="toggle dropdown" />
  </ChevronIcon>
)

const DropdownFilter = ({ selected, name, options, updateTag }) => {
  const [drop, setDrop] = useState(false)

  const toggleDrop = () => setDrop(!drop)

  /**
   * Returns if the supplied tag is in the list of selected tags
   *
   * @param {{value: string}} tag
   */
  const isSelected = tag => {
    const { value } = tag
    return Boolean(selected.find(tag => tag.value === value))
  }

  const color = checkboxColorMap[name]
  const iconPostfix = colorToColorNameMap[color] || ''

  return (
    <>
      <Line />
      <DropdownHeader onClick={e => toggleDrop()} drop={drop} color={color}>
        <DropdownHeaderText>{name}</DropdownHeaderText>
        <Chevron />
      </DropdownHeader>
      <TableWrapper drop={drop}>
        <TableContainer>
          <table>
            <tbody>
              {options.map(tag => (
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
                      cursor: 'pointer',
                      color: color || CLUBS_GREY_LIGHT,
                    }}
                  >
                    <Icon
                      style={{ transform: 'none' }}
                      name={
                        isSelected(tag)
                          ? `check-box${iconPostfix}`
                          : `box${iconPostfix}`
                      }
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
