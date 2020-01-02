import { useState } from 'react'
import s from 'styled-components'

import { TagGroup, InactiveTag, Title, BookmarkIcon } from '../common'
import { ROLE_OFFICER } from '../../utils'
import { Link } from '../../routes'

const Wrapper = s.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
`

const Header = ({
  club,
  userInfo,
  favorites,
  style,
  updateFavorites,
  subscriptions,
  updateSubscriptions,
}) => {
  const isFavorite = favorites.includes(club.code)
  const isSubscription = subscriptions.includes(club.code)

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
      <Wrapper>
        <Title style={{ marginBottom: '0.25rem' }}>
          {name}
          {!active && <InactiveTag />}
        </Title>
        <span>
          {favCount}{' '}
          <BookmarkIcon
            club={club}
            favorite={isFavorite}
            updateFavorites={updateFavorites}
            padding="0"
          />
          <div
            className="button is-success"
            onClick={() => updateSubscriptions(club.code)}
            style={{ marginLeft: 15 }}
          >
            {isSubscription ? 'Unsubscribe' : 'Subscribe'}
          </div>
          {canEdit && (
            <Link route="club-edit" params={{ club: club.code }}>
              <a className="button is-success" style={{ marginLeft: 15 }}>
                Edit Club
              </a>
            </Link>
          )}
        </span>
      </Wrapper>
      <div style={{ marginBottom: '1rem' }}>
        <TagGroup tags={tags} />
      </div>
    </div>
  )
}

export default Header
