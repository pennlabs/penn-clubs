import PropTypes from 'prop-types'
import { BlueTag } from './Tags'

export const TagGroup = ({ tags = [] }) => {
  if (!tags || !tags.length) return null
  return <>
    {tags.map(tag => (
      <BlueTag
        key={`${tag.id}-${tag.value}`}
        className="tag is-rounded has-text-white"
      >
        {tag.name}
      </BlueTag>
    ))}
  </>
}

TagGroup.defaultProps = {
  tags: [],
}

TagGroup.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.number,
    })
  ),
}
