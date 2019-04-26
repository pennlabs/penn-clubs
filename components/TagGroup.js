import React from 'react'
import posed from 'react-pose'
import PropTypes from 'prop-types'
import {
  CLUBS_PURPLE,
} from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.05 },
})

class Tag extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      hover: false,
    }
  }

  findTagById (id) {
    const { allTags } = this.props
    return allTags.find(tag => tag.id === id).name
  }

  render () {
    const { tag } = this.props
    const { hover } = this.state

    return (
      <Pop
        pose={hover ? 'hovered' : 'idle'}
        onMouseEnter={() => this.setState({ hover: true })}
        onMouseLeave={() => this.setState({ hover: false })}
      >
        <span
          className="tag is-rounded has-text-white"
          style={{
            backgroundColor: CLUBS_PURPLE,
            margin: '0 3px',
            fontSize: '0.6em',
          }}
        >
          {this.findTagById(tag)}
        </span>
      </Pop>
    )
  }
}

const TagGroup = ({ clubTags, allTags }) => (
  <div className="is-flex">
    {clubTags.map(tag => <Tag allTags={allTags} tag={tag} />)}
  </div>
)


export default TagGroup
