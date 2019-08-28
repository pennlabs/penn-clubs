import React from 'react'
import s from 'styled-components'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_BLUE, CLUBS_RED, CLUBS_YELLOW
} from '../constants/colors'
import { logEvent } from '../utils/analytics'

const Line = s.hr`
  background-color: rgba(0, 0, 0, .1);
  height: 2px;
  margin: 0;
  margin-top: 30px;
  padding: 0;
`

const DropdownHeader = s.div`
  display: flex;
  justify-content: space-between;
  padding: 7px 3px;
  cursor: pointer;
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
`

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
    const checkboxColor = {
      Type: CLUBS_BLUE,
      Size: CLUBS_RED,
      Application: CLUBS_YELLOW
    }[name]

    return (
      <div>
        <Line />
        <DropdownHeader onClick={(e) => this.toggleDrop()}>
          <strong style={{ color: CLUBS_GREY, opacity: 0.75 }}>{name}</strong>

          <span className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY }}>
            <i className="fas fa-chevron-down"></i>
          </span>
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
                  <td className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY_LIGHT }}>
                    <i className={this.isSelected(tag) ? 'fas fa-check-square' : 'far fa-square'} />
                  </td>
                  <td style={{ color: CLUBS_GREY_LIGHT }}>
                    {tag.label}
                    {(typeof tag.count !== 'undefined') && (
                      <span className='has-text-grey'> ({tag.count})</span>
                    )}
                  </td>
                </TableRow>
              ))}
            </tbody>
          </table>
        </TableWrapper>
      </div>
    )
  }
}

export default DropdownFilter
