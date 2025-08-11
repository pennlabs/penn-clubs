import { ReactElement } from 'react'

import { Affiliation, Tag } from '../../types'
import { BlueTag, Tag as DefaultTag } from './Tags'

type TagGroupProps = {
  tags?: (Tag | Affiliation)[]
}

function isAffiliation(tag): tag is Affiliation {
  return tag?.label !== undefined || tag?.color !== undefined
}

export const TagGroup = ({
  tags = [],
}: TagGroupProps): ReactElement<any> | null => {
  if (!tags || !tags.length) return null

  // sometimes there will be duplicate affiliations, or an affiliation will end up with the same content as a tag
  // when there are duplicate affiliations, choose one arbitrarily
  // when there's a tag and an affiliation with the same content, render the affiliation

  const uniqueTags = tags.reduce((acc, tag) => {
    if (!tag) return acc
    const key = isAffiliation(tag) ? tag.label : tag.name
    if (!acc.has(key)) {
      acc.set(key, tag)
    } else if (isAffiliation(tag)) {
      acc.set(key, tag)
    }
    return acc
  }, new Map())

  return (
    <>
      {Array.from(uniqueTags.values()) // display affiliations after tags
        .sort((a, b) => {
          if (isAffiliation(a) && !isAffiliation(b)) return 1
          if (!isAffiliation(a) && isAffiliation(b)) return -1
          if (isAffiliation(a) && isAffiliation(b)) {
            // affiliations should be sorted by color
            return a.color.localeCompare(b.color)
          }
          return 0
        })
        .map((tag) =>
          isAffiliation(tag) ? (
            <DefaultTag
              key={`${tag.id}-affiliation`}
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
