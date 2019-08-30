import React from 'react'
import { BlueTag } from './Tags'

export default (props) => {
  const { tags } = props
  if (!tags || !tags.length) return null
  return (
    tags.map(({ id, name }) => (
      <BlueTag key={id} className="tag is-rounded has-text-white">
        {name}
      </BlueTag>
    ))
  )
}
