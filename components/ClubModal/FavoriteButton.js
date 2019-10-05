import s from 'styled-components'

import {
  HOVER_GRAY, FOCUS_GRAY, LIGHTER_RED, LIGHT_RED, RED, DARK_GRAY
} from '../../constants/colors'
import { mediaMaxWidth, SM } from '../../constants/measurements'

const FavoriteButton = s.button`
  padding: 10px 10px 0 0;
  cursor: pointer;
  line-height: 0;
  padding: 10px;
  float: right;
  border-width: 0;
  background-color: ${HOVER_GRAY};
  font-weight: 600;
  color: ${DARK_GRAY} !important;
  margin-bottom: 1rem;

  &:hover {
    background-color: ${FOCUS_GRAY};
  }

  ${({ favorite }) => favorite && `
    color: ${RED} !important;
    background-color: ${LIGHTER_RED};

    &:hover {
      background-color: ${LIGHT_RED};
    }
  `}

  ${mediaMaxWidth(SM)} {
    margin-bottom: 0.5rem;
  }
`

const Icon = s.i`
  position: absolute;
  right: 10px;
  top: 10px;
`

export default ({ updateFavorites, club, favorite }) => (
  <FavoriteButton
    favorite={favorite}
    onClick={(e) => {
      updateFavorites(club.code)
      e.stopPropagation()
    }}
    className="button">
    {favorite ? 'Remove From Favorites' : 'Add to Favorites'}
    {' '}
    <Icon className={`fa-heart ${favorite ? 'fas' : 'far'}`} />
  </FavoriteButton>
)
