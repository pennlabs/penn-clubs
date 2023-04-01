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

  return (
    <>
      {tags.map((tag) =>
        isBadge(tag) ? (
          <DefaultTag key={`${tag.id}-badge`} className="tag is-rounded">
            {tag.label}
          </DefaultTag>
        ) : (
          <BlueTag
            key={`${tag.id}-tag`}
            className="tag is-rounded has-text-white"
            color={'black'}
            foregroundColor="orange"
          >
            {tag.name}
          </BlueTag>
        ),
      )}
    </>
  )
}
