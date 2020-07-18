import { ReactElement } from 'react'

import { Badge, Tag } from '../../types'
import { BlueTag, Tag as DefaultTag } from './Tags'

type TagGroupProps = {
  tags?: (Tag | Badge)[]
}

export const TagGroup = ({ tags = [] }: TagGroupProps): ReactElement | null => {
  if (!tags || !tags.length) return null

  return (
    <>
      {tags.map((tag) => {
        switch (tag.kind) {
          case 'badge':
            return (
              <DefaultTag
                key={`${tag.id}-${tag.kind}`}
                color={tag.color}
                className="tag is-rounded"
              >
                {tag.label}
              </DefaultTag>
            )
          case 'tag':
            return (
              <BlueTag
                key={`${tag.id}-${tag.kind}`}
                className="tag is-rounded has-text-white"
              >
                {tag.name}
              </BlueTag>
            )
        }
      })}
    </>
  )
}
