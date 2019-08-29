import React from 'react'
import s from 'styled-components'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_BLUE, CLUBS_RED, CLUBS_YELLOW, BORDER,
  LIGHT_GRAY, WHITE
} from '../constants/colors'
import {
  mediaMaxWidth, MD, SEARCH_BAR_MOBILE_HEIGHT, NAV_HEIGHT
} from '../constants/measurements'
import { logEvent } from '../utils/analytics'

const checkboxColorMap = {
  Type: CLUBS_BLUE,
  Size: CLUBS_RED,
  Application: CLUBS_YELLOW
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

    ${({ drop, color }) => drop && `
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

  ${({ drop }) => drop && `
    max-height: 100vh;
    opacity: 1;
  `}

  ${mediaMaxWidth(MD)} {
    position: fixed;
    left: 0;
    width: 100%;
    top: calc(${SEARCH_BAR_MOBILE_HEIGHT} + ${NAV_HEIGHT});
    background: ${WHITE};
    height: calc(100vh - ${SEARCH_BAR_MOBILE_HEIGHT} - ${NAV_HEIGHT});
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
  color: ${CLUBS_GREY};
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
    <i className="fas fa-chevron-down" />
  </ChevronIcon>
)

class DropdownFilter extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hoverArrow: false,
      drop: false,
      selected: props.selected
    }
  }

  toggleDrop() {
    this.setState({ drop: !this.state.drop })
  }

  isSelected(tag) {
    const { value } = tag
    const { selected } = this.props
    return selected.find(tag => tag.value === value)
  }

  render() {
    const { name, options, updateTag } = this.props
    const { drop } = this.state

    const color = checkboxColorMap[name]

    return (
      <>
        <Line />
        <DropdownHeader onClick={(e) => this.toggleDrop()} drop={drop} color={color}>
          <DropdownHeaderText>{name}</DropdownHeaderText>
          <Chevron />
        </DropdownHeader>
        <TableWrapper drop={drop}>
          <table>
            <tbody>
              {options.map(tag => (
                <TableRow
                  key={tag.label}
                  onClick={(e) => {
                    logEvent('filter', name)
                    updateTag(tag, name)
                  }}>
                  <td className="icon" style={{ cursor: 'pointer', color: color || CLUBS_GREY_LIGHT }}>
                    <i className={this.isSelected(tag) ? 'fas fa-check-square' : 'far fa-square'} />
                    &nbsp;
                  </td>
                  <td style={{ color: CLUBS_GREY_LIGHT }}>
                    <p style={{ marginBottom: '3px' }}>
                      {tag.label}
                      {(typeof tag.count !== 'undefined') && (
                        <span className='has-text-grey'>
                          {' '}
                          ({tag.count})
                        </span>
                      )}
                    </p>
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </>
    )
  }
}

export default DropdownFilter
