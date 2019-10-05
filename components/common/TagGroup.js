import PropTypes from 'prop-types'
import { BlueTag, SelectedTag } from './Tags'

const TagGroup = ({ tags = [], selectedTags = [], updateTag }) => {
  if (!tags || !tags.length) return null

  // TODO: Use same tag format between DropdownFilter and TagGroup
  return tags.map(tag => {
    const matchedTag = selectedTags.find(({ value }) => value === tag.id)
    if (matchedTag) {
      return (
        <SelectedTag
          key={tag.value}
          className="tag is-rounded has-text-white"
          onClick={e => {
            // Prevent click event from propagating so clicking on the tag doesn't
            // open the ClubModal displaying the club the tag is nested inside
            e.stopPropagation()
            updateTag && updateTag(matchedTag, matchedTag.name)
          }}
        >
          {tag.name}
          <button className="delete is-small" />
        </SelectedTag>
      )
    }
    return (
      <BlueTag
        key={tag.id}
        className="tag is-rounded has-text-white"
        onClick={e => {
          // Stop propagation of click event for same reasons as above
          e.stopPropagation()
          updateTag &&
            updateTag(
              {
                value: tag.id,
                label: tag.name,
                name: 'Type',
              },
              'Type'
            )
        }}
      >
        {tag.name}
      </BlueTag>
    )
  })
}

TagGroup.defaultProps = {
  selectedTags: [],
  tags: [],
}

TagGroup.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.string,
    })
  ),
  selectedTags: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
    })
  ),
  updateTag: PropTypes.func.isRequired,
}

export default TagGroup
