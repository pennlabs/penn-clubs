import { useState } from 'react'
import s from 'styled-components'

import Icon from '../common/Icon'
import { CLUBS_GREY, CLUBS_BLUE, WHITE } from '../../constants/colors'
import { ROLE_OFFICER } from '../../utils'
import { Link } from '../../routes'

const Title = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  padding-right: 10px;
`

const Header = props => {
  const { club, userInfo, favorites } = props

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

  return (
    <div>
      <Title>
        <h1
          className="title is-size-2-desktop is-size-3-mobile"
          style={{ color: CLUBS_GREY, marginBottom: 10 }}
        >
          {club.name}{' '}
          {club.active || <span className="has-text-grey">(Inactive)</span>}
        </h1>
        <span>
          {favCount}{' '}
          <Icon
            name={isFavorite ? 'heart-red' : 'heart'}
            alt={isFavorite ? 'click to unfavorite' : 'click to favorite'}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              console.log('click')
              props.updateFavorites(club.code)
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
        {club.tags.map(tag => (
          <span
            key={tag.id}
            className="tag is-rounded"
            style={{ backgroundColor: CLUBS_BLUE, color: WHITE, margin: 3 }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default Header
