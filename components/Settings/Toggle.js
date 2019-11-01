// modified from basics
import { Component } from 'react'
import s from 'styled-components'
import PropTypes from 'prop-types'

import { LIGHT_GRAY, MEDIUM_GRAY, CLUBS_BLUE } from '../../constants/colors'

const HEIGHT = 0.875
const WIDTH = 2.25

const Label = s.span`
  display: inline-block;
  margin-bottom: 0;
  color: ${MEDIUM_GRAY};
  transition: all 0.2 ease;
  cursor: pointer;
  opacity: 0.6;
  ${({ active }) =>
    active &&
    `
    opacity: 1;
    color: ${CLUBS_BLUE} !important;
  `}
`

const ToggleWrapper = s.div`
  width: ${WIDTH}rem;
  position: relative;
  display: inline-block;
  margin-left: 0.625rem;
  margin-right: 0.625em;
`

const Bar = s.div`
  transition: all 0.2s ease;
  width: 100%;
  height: ${HEIGHT}rem;
  border-radius: ${HEIGHT}rem;
  margin-top: ${(1.4 - HEIGHT) / 2}rem;
  display: inline-block;
  cursor: pointer;
`

const Circle = s.div`
  transition: all 0.2s ease;
  height: ${HEIGHT + 0.4}rem;
  width: ${HEIGHT + 0.4}rem;
  border-radius: 100%;
  margin-top: ${(1.4 - HEIGHT) / 2 - 0.2}rem;
  position: absolute;
  background: ${CLUBS_BLUE};
  margin-left: ${({ active }) => (active ? `${WIDTH - HEIGHT - 0.4}rem` : '0')};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  cursor: pointer;
`

/**
 * @param {boolean} filter: filter in the redux
 * @param {string} filterOffText: text rendered when the filter is off
 * @param {string} filterOnText text rendered when filter is on
 */

class Toggle extends Component {
  constructor(props) {
    super(props)
    this.state = {
      active: props.active,
    }
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(e) {
    this.props.toggle(this.props.club)
    this.setState({ active: !this.state.active })
  }

  render() {
    const { filterOffText, filterOnText } = this.props
    const { active } = this.state
    return (
      <div>
        <Label onClick={this.handleClick} active>
          {filterOffText}
        </Label>
        <ToggleWrapper>
          <Circle style={{ background: active ? CLUBS_BLUE : MEDIUM_GRAY }} onClick={this.handleClick} active={active} />
          <Bar style={{ background: active ? '#D3EBF3' : LIGHT_GRAY }} onClick={this.handleClick} active={active} />
        </ToggleWrapper>
        <Label onClick={this.handleClick} active>
          {filterOnText}
        </Label>
      </div>
    )
  }
}

Toggle.defaultProps = {
  filter: false,
  filterOffText: '',
  filterOnText: '',
}

Toggle.propTypes = {
  filter: PropTypes.bool,
  filterOffText: PropTypes.string,
  filterOnText: PropTypes.string,
  applyFilter: PropTypes.func,
}

export default Toggle
