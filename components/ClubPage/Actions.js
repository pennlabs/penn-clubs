import { useState } from 'react'
import Link from 'next/link'
import s from 'styled-components'
import { ALLBIRDS_GRAY, WHITE } from '../../constants/colors'

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

const IconWrapper = s.span`
  display: inline-block;
  vertical-align: middle;
`

const BookmarkIconWrapper = s.span`
  display: inline-block;
  margin-top: 6px;
`

const BookmarkCountWrapper = s.span`
  display: inline-block;
  vertical-align: text-bottom;
  margin-top: 1px;
  margin-bottom: -1px;
`

const ActionWrapper = s.span`
    display: inline-block;
    flex-direction: row;
    align-items: center;
    background-color: ${WHITE};
    border-radius: 30px;
    border: 1px solid ${ALLBIRDS_GRAY};
    padding-left: 1rem;
    padding-right: 1rem;
`

const ActionDiv = s.span`
    display: inline-block;
    color: #4a4a4a;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    vertical-align: middle;
`

const Actions = ({
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

  // a user can edit a club if they are either a superuser or in the club and
  // at least an officer
  const canEdit =
    (inClub && inClub.role <= ROLE_OFFICER) ||
    (userInfo && userInfo.is_superuser)

  const [favCount, setFavCount] = useState(club.favorite_count || 0)

  const { code } = club

  return (
    <div style={style}>
      <Wrapper>
        <ActionWrapper>
          <IconWrapper>
            <BookmarkIconWrapper>
              <BookmarkIcon
                club={club}
                favorite={isFavorite}
                updateFavorites={(id) => {
                  const upd = updateFavorites(id)
                  setFavCount(favCount + (upd ? 1 : -1))
                }}
                padding="0"
              />
            </BookmarkIconWrapper>
            {' '}<BookmarkCountWrapper>{favCount}</BookmarkCountWrapper>
          </IconWrapper>
          <ActionDiv>|</ActionDiv>
          <IconWrapper>
            <SubscribeIcon
              club={club}
              subscribe={isSubscription}
              updateSubscribes={updateSubscriptions}
            />
          </IconWrapper>
        </ActionWrapper>
        { canEdit && (
          <Link href="/club/[club]/edit" as={`/club/${code}/edit`}>
            <a className="button is-success is-small" style={{ marginLeft: '1rem' }}>
                    Edit Club
            </a>
          </Link>
        )}
      </Wrapper>
    </div>
  )
}

export default Actions
