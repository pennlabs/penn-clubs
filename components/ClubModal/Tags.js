import React from 'react'
import { CLUBS_BLUE } from '../../colors'

export default ({ tags }) => {
  if (!tags || !tags.length) return null

  return (
    <div>
      {tags ? tags.map(tag => (
        <span
          key={tag.id}
          className="tag is-rounded has-text-white"
          style={{ backgroundColor: CLUBS_BLUE, margin: 3 }}>
          {tag.name}
        </span>
      )) : ''}
    </div>
  )
}
