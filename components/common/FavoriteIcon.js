import PropTypes from 'prop-types'
import s from 'styled-components'

import Icon from '../common/Icon'
import { LIGHT_GRAY, MEDIUM_GRAY, RED } from '../../constants/colors'

const FavoriteIconTag = s.span`
  color: ${LIGHT_GRAY};
  float: right;
  padding: ${({ padding }) => padding || '10px 10px 0 0'};
  cursor: pointer;

  &:hover {
    color: ${MEDIUM_GRAY};
  }

  ${({ absolute }) =>
    absolute &&
    `
    float: none;
    position: absolute;
    right: 0;
  `}

  ${({ favorite }) =>
    favorite &&
    `
    color: ${RED} !important;
  `}
`

const FavoriteIcon = ({
  updateFavorites,
  club,
  favorite,
  absolute = false,
  padding,
}) => (
  <FavoriteIconTag
    favorite={favorite}
    absolute={absolute}
    padding={padding}
    onClick={e => {
      e.stopPropagation()
      updateFavorites(club.code)
    }}
  >
    <Icon
      name={favorite ? 'heart-red' : 'heart'}
      alt={favorite ? 'click to unfavorite' : 'click to favorite'}
    />
  </FavoriteIconTag>
)

FavoriteIcon.defaultProps = {
  absolute: false,
  favorite: false,
  padding: null,
}

FavoriteIcon.propTypes = {
  updateFavorites: PropTypes.func.isRequired,
  absolute: PropTypes.bool,
  club: PropTypes.shape({
    code: PropTypes.string,
  }).isRequired,
  favorite: PropTypes.bool,
  padding: PropTypes.string,
}

export default FavoriteIcon
