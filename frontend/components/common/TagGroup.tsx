import { ReactElement } from 'react'

import { Badge, Tag } from '../../types'
import { BlueTag, Tag as DefaultTag } from './Tags'

type TagGroupProps = {
  tags?: (Tag | Badge)[]
}

function isBadge(tag): tag is Badge {
  return tag.label !== undefined || tag.color !== undefined
}

export const TagGroup = ({ tags = [] }: TagGroupProps): ReactElement | null => {
  if (!tags || !tags.length) return null

  // sometimes there will be duplicate badges, or a badge will end up with the same content as a tag
  // when there are duplicate badges, choose one arbitrarily
  // when there's a tag and a badge with the same content, render the badge

  const uniqueTags = tags.reduce((acc, tag) => {
    const key = isBadge(tag) ? tag.label : tag.name
    if (!acc.has(key)) {
      acc.set(key, tag)
    } else if (isBadge(tag)) {
      acc.set(key, tag)
    }
    return acc
  }, new Map())

  return (
    <>
      {Array.from(uniqueTags.values()) // display badges after tags
        .sort((a, b) => {
          if (isBadge(a) && !isBadge(b)) return 1
          if (!isBadge(a) && isBadge(b)) return -1
          return 0
        })
        .map((tag) =>
          isBadge(tag) ? (
            <DefaultTag
              key={`${tag.id}-badge`}
              color={tag.color}
              className="tag is-rounded"
            >
              {tag.label}
            </DefaultTag>
          ) : (
            <BlueTag
              key={`${tag.id}-tag`}
              className="tag is-rounded has-text-white"
            >
              {tag.name}
            </BlueTag>
          ),
        )}
    </>
  )
}
