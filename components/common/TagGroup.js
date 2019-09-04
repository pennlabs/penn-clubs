import React from 'react'
import { BlueTag, SelectedTag } from './Tags'

export default (props) => {
  let { tags, selectedTags, updateTag } = props
  if (!tags || !tags.length) return null
  selectedTags = selectedTags || []
  // TODO: Use same tag format between DropdownFilter and TagGroup
  return (
    tags.map(tag => {
      const matchedTag = selectedTags.find(({ value }) => value === tag.id)
      if (matchedTag) {
        return <SelectedTag
          key={tag.value}
          className="tag is-rounded has-text-white"
          onClick={(e) => {
            // Prevent click event from propagating so clicking on the tag doesn't
            // open the ClubModal displaying the club the tag is nested inside
            e.stopPropagation()
            updateTag && updateTag(matchedTag, matchedTag.name)
          }}
        >
          {tag.name}
          <button className="delete is-small" />
        </SelectedTag>
      }
      return <BlueTag
        key={tag.id}
        className="tag is-rounded has-text-white"
        onClick={(e) => {
          // Stop propagation of click event for same reasons as above
          e.stopPropagation()
          updateTag && updateTag({
            value: tag.id,
            label: tag.name,
            name: 'Type'
          }, 'Type')
        }}
      >
        {tag.name}
      </BlueTag>
    })
  )
}
