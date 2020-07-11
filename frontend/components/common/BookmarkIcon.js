import PropTypes from 'prop-types'
import s from 'styled-components'

import { BLACK, MEDIUM_GRAY } from '../../constants/colors'

const BookmarkIconTag = s.span`
  padding: ${({ padding }) => padding || '15px 10px 0 0'};
  cursor: pointer;

  ${({ absolute }) =>
    absolute &&
    `
    float: none;
    position: absolute;
    right: 0;

  `}

  svg {
    height: 1rem;
    width: 1rem;
    fill: ${({ favorite }) => (favorite ? BLACK : 'none')};
    stroke: ${({ favorite }) => (favorite ? BLACK : MEDIUM_GRAY)};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;

    &:hover {
      fill: ${({ favorite }) => (favorite ? BLACK : MEDIUM_GRAY)};
    }
  }
`

export const BookmarkIcon = ({
  updateFavorites,
  club,
  favorite,
  absolute = false,
  padding,
}) => (
  <BookmarkIconTag
    favorite={favorite}
    absolute={absolute}
    padding={padding}
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      updateFavorites(club.code)
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="feather feather-bookmark"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
  </BookmarkIconTag>
)

BookmarkIcon.defaultProps = {
  absolute: false,
  favorite: false,
  padding: null,
}

BookmarkIcon.propTypes = {
  updateFavorites: PropTypes.func.isRequired,
  absolute: PropTypes.bool,
  club: PropTypes.shape({
    code: PropTypes.string,
  }).isRequired,
  favorite: PropTypes.bool,
  padding: PropTypes.string,
}
