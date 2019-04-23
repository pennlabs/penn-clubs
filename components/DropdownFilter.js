import React from 'react'
import posed from 'react-pose'
import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.1 },
})

class DropdownFilter extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      hoverArrow: false,
      drop: false,
      selected: props.selected,
    }
  }

  toggleDrop() {
    this.setState({drop: !this.state.drop})
  }

  toggleSelect(option) {
    var selected = this.state.selected
    if (selected.includes(option)) {
      selected.splice(selected.indexOf(option), 1)
    } else {
      selected.push(option)
    }
    this.props.update(selected)
  }

  render() {
    var { name, options } = this.props
    var { drop, hoverDown, selected } = this.state
    return(
      <div>
        <hr style={{backgroundColor: CLUBS_GREY, height:"2px", margin: 0, marginTop: 30, padding: 0}}/>
        <div style={{display: "flex", justifyContent: "space-between", padding: "7px 3px"}}>
          <p style={{color: CLUBS_GREY}}>{name} </p>
          <Pop
            pose={hoverDown ? "hovered" : "idle"}
            onMouseEnter={() => this.setState({ hoverDown: true })}
            onMouseLeave={() => this.setState({ hoverDown: false })}>
            <span className="icon" style={{cursor: "pointer", color: CLUBS_GREY}} onClick={(e)=>this.toggleDrop()}>
              <i class="fas fa-chevron-down"></i>
            </span>
          </Pop>
        </div>
        {drop ? (options.map(option => (
          <div style={{display: "flex", paddingTop: 3}}>
            <span className="icon" style={{cursor: "pointer", color: CLUBS_GREY_LIGHT}} onClick={(e)=>this.toggleSelect(option.value)}>
              <i className={selected.includes(option.value) ? "far fa-check-square" : "far fa-square"}></i>
            </span>
            <p style={{color: CLUBS_GREY_LIGHT}}>{option.label}</p>
          </div>
        ))) : ""}
      </div>
    )
  }
}

export default DropdownFilter
