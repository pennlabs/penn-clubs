import { useState } from 'react'
import Link from 'next/link'
import s from 'styled-components'
import { WHITE, BORDER, MEDIUM_GRAY, BLACK_ALPHA } from '../../constants/colors'

import { BookmarkIcon, SubscribeIcon } from '../common'
import { ROLE_OFFICER } from '../../utils'

const Wrapper = s.div`
  display: inline-block;
  justify-content: space-between;
  flex-direction: row;
  width: inherit;
  align-items: right;
  padding-bottom: 0.5rem;
`

const BookmarkIconWrapper = s.span`
`

const BookmarkCountWrapper = s.span`
  margin-left: 2px;
  color: ${MEDIUM_GRAY};
`

const ActionWrapper = s.span`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding-top: 5px;
  background-color: ${WHITE};
  border-radius: 30px;
  border: 1px solid ${BORDER};
  padding-left: 0.8rem;
  padding-right: 0.8rem;
  margin-bottom: 0.8rem;
  line-height: 1;
  height: 30px;
  box-shadow: 0 1px 4px ${BLACK_ALPHA(0.2)};

  span {
    line-height: 1;
  }
`

const ActionDiv = s.span`
  display: inline-block;
  opacity: 0.1;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  line-height: 1;
  margin-top: -1px;
`

const Actions = ({
  club,
  userInfo,
  favorites,
  style,
  updateFavorites,
  subscriptions,
  updateSubscriptions,
  className,
}) => {
  const isFavorite = favorites.includes(club.code)
  const isSubscription = subscriptions.includes(club.code)

  // inClub is set to the membership object if the user is in the club, or false
  // otherwise
  const inClub =
    userInfo &&
    (userInfo.membership_set.filter(a => a.id === club.code) || [false])[0]

  // a user can edit a club if they are either a superuser or in the club and
  // at least an officer
  const canEdit =
    (inClub && inClub.role <= ROLE_OFFICER) ||
    (userInfo && userInfo.is_superuser)

  const [favCount, setFavCount] = useState(club.favorite_count || 0)

  const { code } = club

  return (
    <div className={className} style={style}>
      <Wrapper>
        <ActionWrapper>
          <BookmarkIconWrapper>
            <BookmarkIcon
              club={club}
              favorite={isFavorite}
              updateFavorites={id => {
                const upd = updateFavorites(id)
                setFavCount(favCount + (upd ? 1 : -1))
              }}
              padding="0"
            />
          </BookmarkIconWrapper>{' '}
          <BookmarkCountWrapper>{favCount}</BookmarkCountWrapper>
          <ActionDiv>|</ActionDiv>
          <SubscribeIcon
            padding="0"
            club={club}
            subscribe={isSubscription}
            updateSubscribes={updateSubscriptions}
          />
        </ActionWrapper>
        {canEdit && (
          <Link href="/club/[club]/edit" as={`/club/${code}/edit`}>
            <a
              className="button is-success is-normal"
              style={{ marginLeft: '1rem' }}
            >
              Edit Club
            </a>
          </Link>
        )}
      </Wrapper>
    </div>
  )
}

export const DesktopActions = s(Actions)`
  @media (max-width: 768px) {
    display: none !important;
  }
`

export const MobileActions = s(Actions)`
  @media (min-width: 769px) {
    display: none !important;
  }
`
