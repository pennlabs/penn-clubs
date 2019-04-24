import React from 'react'
import posed from 'react-pose'
import { CLUBS_PURPLE, CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_PERIWINKLE } from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.05 },
})

class Tag extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hover: false
    }
  }

  findTagById(id) {
    return this.props.allTags.find(tag => tag.id == id).name
  }

  render() {
    var { tag } = this.props
    return (
      <Pop
        pose={this.state.hover ? "hovered" : "idle"}
        onMouseEnter={() => this.setState({ hover: true })}
        onMouseLeave={() => this.setState({ hover: false })}>
        <span
          className="tag is-rounded has-text-white"
          style={{backgroundColor: CLUBS_PURPLE, margin: "0 3px", fontSize: "0.6em"}}>
          {this.findTagById(tag)}
        </span>
      </Pop>)
  }
}


const TagGroup = (props) => (
  <div className="is-flex">
    {props.clubTags.map(tag => <Tag allTags={props.allTags} tag={tag}/>)}
  </div>
)


export default TagGroup
