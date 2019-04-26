import React from 'react'
import PropTypes from 'prop-types'
import ClubList from '../components/ClubList'
import renderPage from '../renderPage'
import { CLUBS_GREY } from '../colors'

const Favorites = ({
  tags,
  favorites,
  updateFavorites,
  openModal,
  favoriteClubs,
}) => (
  <div
    style={{
      padding: '0 2rem', display: 'flex', alignItems: 'center', minHeight: '72vh', flexDirection: 'column',
    }}
  >
    <div style={{ padding: '30px 0' }}>
      <h1 className="title" style={{ color: CLUBS_GREY }}>Favorites</h1>
    </div>

    {favoriteClubs.map(club => (
      <ClubList
        club={club}
        tags={tags}
        updateFavorites={updateFavorites}
        openModal={openModal}
        favorite={favorites.includes(club.id)}
      />
    ))}

    {
      (favorites.length === 0) ? (
        <p className="has-text-light-grey" style={{ paddingTop: 200 }}>
          No favorites yet! Browse clubs
          <a href="/">here.</a>
        </p>
      ) : <div />
    }
  </div>
)

Favorites.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  favorites: PropTypes.arrayOf(PropTypes.string).isRequired,
  favoriteClubs: PropTypes.arrayOf(PropTypes.string).isRequired,
  updateFavorites: PropTypes.func.isRequired,
  openModal: PropTypes.func.isRequired,
}

export default renderPage(Favorites)
