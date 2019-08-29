import s from 'styled-components'
import { LIGHT_GRAY, MEDIUM_GRAY, RED } from '../../constants/colors'

const FavoriteIcon = s.span`
  color: ${LIGHT_GRAY};
  float: right;
  padding: 10px 10px 0 0;
  cursor: pointer;

  &:hover {
    color: ${MEDIUM_GRAY};
  }

  ${({ absolute }) => absolute && `
    float: none;
    position: absolute;
    right: 0;
  `}

  ${({ favorite }) => favorite && `
    color: ${RED} !important;
  `}
`

export default ({ updateFavorites, club, favorite, absolute = false }) => (
  <FavoriteIcon
    favorite={favorite}
    absolute={absolute}
    onClick={(e) => {
      updateFavorites(club.id)
      e.stopPropagation()
    }}
    className="icon">
    <i className={`fa-heart ${favorite ? 'fas' : 'far'}`} />
  </FavoriteIcon>
)
