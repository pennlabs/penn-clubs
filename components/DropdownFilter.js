import React from 'react'
import posed from 'react-pose'
import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.1 },
})

class DropdownFilter extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      hoverArrow: false,
      drop: false,
      selected: props.selected,
    }
  }

  toggleDrop () {
    this.setState({ drop: !this.state.drop })
  }

  isSelected (tag) {
    const { label, value, name } = tag
    const { selected } = this.props
    return selected.find(tag => tag.value === value)
  }

  render () {
    const {
      name, options, selected, updateTag,
    } = this.props
    const { drop, hoverDown } = this.state
    return (
      <div>
        <hr style={{
          backgroundColor: CLUBS_GREY, height: '2px', margin: 0, marginTop: 30, padding: 0,
        }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 3px' }}>
          <p style={{ color: CLUBS_GREY }}>
            {name}
            {' '}
          </p>
          <Pop
            pose={hoverDown ? 'hovered' : 'idle'}
            onMouseEnter={() => this.setState({ hoverDown: true })}
            onMouseLeave={() => this.setState({ hoverDown: false })}
          >
            <span className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY }} onClick={e => this.toggleDrop()}>
              <i className="fas fa-chevron-down" />
            </span>
          </Pop>
        </div>
        {drop ? (options.map(tag => (
          <div style={{ display: 'flex', paddingTop: 3 }}>
            <span className="icon" style={{ cursor: 'pointer', color: CLUBS_GREY_LIGHT }} onClick={e => updateTag(tag, name)}>
              <i className={this.isSelected(tag) ? 'fas fa-check-square' : 'far fa-square'} />
            </span>
            <p style={{ color: CLUBS_GREY_LIGHT }}>{tag.label}</p>
          </div>
        ))) : ''}
      </div>
    )
  }
}

export default DropdownFilter
