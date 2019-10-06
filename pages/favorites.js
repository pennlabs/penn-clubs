import React from 'react'
import s from 'styled-components'

import ClubList from '../components/ClubList'
import { renderListPage } from '../renderPage'
import { CLUBS_GREY } from '../constants/colors'

const Wrapper = s.div`
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
`

const Image = s.img`
  max-width: 100%;
  width: 12rem;
`

// TODO PropTypes

const Favorites = ({
  tags,
  favorites,
  updateFavorites,
  openModal,
  favoriteClubs,
}) => (
  <Wrapper>
    <div style={{ padding: '30px 0' }}>
      <h1 className="title" style={{ color: CLUBS_GREY }}>
        Favorites
      </h1>
    </div>

    {favoriteClubs.map(club => (
      <ClubList
        key={club.code}
        club={club}
        tags={tags}
        updateFavorites={updateFavorites}
        openModal={openModal}
        favorite={favorites.includes(club.code)}
      />
    ))}

    {!favorites.length && (
      <div
        style={{
          paddingTop: '1rem',
          textAlign: 'center',
          marginBottom: '1rem',
        }}
      >
        <Image src="/static/img/no-favorites.svg" alt="No favorites" />
        <p className="has-text-light-grey" style={{ marginBottom: '1rem' }}>
          {"You haven't selected any favorites yet!"}
        </p>
        <a href="/" className="button is-info">
          Browse Clubs
        </a>
      </div>
    )}
  </Wrapper>
)

export default renderListPage(Favorites)
