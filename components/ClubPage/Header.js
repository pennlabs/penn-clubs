import { useState } from 'react'
import s from 'styled-components'

import { Icon, TagGroup } from '../common'
import {
  CLUBS_GREY,
  BLACK_ALPHA,
  DARK_GRAY,
} from '../../constants/colors'
import { ROLE_OFFICER } from '../../utils'
import { Link } from '../../routes'

const Title = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding-right: 10px;
`

const InactiveMarker = s.span`
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 1rem;
  background: ${BLACK_ALPHA(0.05)};
  color: ${DARK_GRAY};
  opacity: 0.8;
  padding: 0.5rem 0.6rem;
  transform: translateY(-0.5rem);
  border-radius: 0.2rem;
`

const Header = ({ club, userInfo, favorites, style, updateFavorites }) => {
  const isFavorite = favorites.includes(club.code)

  // inClub is set to the membership object if the user is in the club, or false
  // otherwise
  const inClub =
    userInfo &&
    (userInfo.membership_set.filter(a => a.id === club.code) || [false])[0]

  // a user can e dit a club if they are either a superuser or in the club and
  // at least an officer
  const canEdit =
    (inClub && inClub.role <= ROLE_OFFICER) ||
    (userInfo && userInfo.is_superuser)

  const [favCount, setFavCount] = useState(club.favorite_count || 0)

  const { active, name, tags } = club

  return (
    <div style={style}>
      <Title>
        <h1
          className="title is-size-2-desktop is-size-3-mobile"
          style={{ color: CLUBS_GREY, marginBottom: 10 }}
        >
          {name}
          {!active && <InactiveMarker>Inactive</InactiveMarker>}
        </h1>
        <span>
          {favCount}{' '}
          <Icon
            name={isFavorite ? 'heart-red' : 'heart'}
            alt={isFavorite ? 'click to unfavorite' : 'click to favorite'}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              updateFavorites(club.code)
                ? setFavCount(favCount + 1)
                : setFavCount(Math.max(0, favCount - 1))
            }}
          />
          {canEdit && (
            <Link route="club-edit" params={{ club: club.code }}>
              <a className="button is-success" style={{ marginLeft: 15 }}>
                Edit Club
              </a>
            </Link>
          )}
        </span>
      </Title>
      <div style={{ marginBottom: 20 }}>
        <TagGroup tags={tags} />
      </div>
    </div>
  )
}

export default Header
