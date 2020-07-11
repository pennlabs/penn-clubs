import PropTypes from 'prop-types'

import { BlueTag, Tag } from './Tags'

export const TagGroup = ({ tags = [] }) => {
  if (!tags || !tags.length) return null

  return (
    <>
      {tags.map(tag => {
        if (tag.color) {
          return (
            <Tag
              key={`${tag.id}-${tag.value}`}
              color={tag.color}
              className="tag is-rounded"
            >
              {tag.name || tag.label}
            </Tag>
          )
        }

        return (
          <BlueTag
            key={`${tag.id}-${tag.value}`}
            className="tag is-rounded has-text-white"
          >
            {tag.name || tag.label}
          </BlueTag>
        )
      })}
    </>
  )
}

TagGroup.defaultProps = {
  tags: [],
}

TagGroup.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      label: PropTypes.string,
      color: PropTypes.string,
      id: PropTypes.number,
    }),
  ),
}
