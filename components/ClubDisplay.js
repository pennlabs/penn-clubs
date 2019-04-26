import React from 'react'
import PropTypes from 'prop-types'
import ClubCard from './ClubCard'
import ClubTableRow from './ClubTableRow'

const ClubDisplay = ({
  displayClubs,
  tags,
  openModal,
  favorites,
  updateFavorites,
  display,
}) => (
  <div style={{ paddingRight: 40 }}>
    {(display === 'cards') ? (
      <div className="columns is-multiline is-desktop is-tablet">
        {displayClubs.map(club => (
          <ClubCard
            club={club}
            tags={tags}
            openModal={openModal}
            updateFavorites={updateFavorites}
            favorite={favorites.includes(club.id)}
          />
        ))}
      </div>
    ) : (
      <table
        className="table is-fullwidth is-hoverable"
        style={{ borderTop: '1px solid #e5e5e5' }}
      >
        <tbody>
          {displayClubs.map(club => (
            <ClubTableRow
              club={club}
              tags={tags}
              updateFavorites={updateFavorites}
              openModal={openModal}
              favorite={favorites.includes(club.id)}
            />
          ))}
        </tbody>
      </table>
    )
  }
  </div>
)

ClubDisplay.propTypes = {
  displayClubs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  openModal: PropTypes.func.isRequired,
  display: PropTypes.string.isRequired,
  updateFavorites: PropTypes.func.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  favorites: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default ClubDisplay
