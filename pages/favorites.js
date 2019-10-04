import React from 'react'
import s from 'styled-components'

import ClubList from '../components/ClubList'
import { renderListPage } from '../renderPage'
import { CLUBS_GREY } from '../constants/colors'

const Wrapper = s.div`
  padding: 0 2rem;
  display: flex;
  align-items: center;
  flex-direction: column;
`

class Favorites extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: false,
      modalClub: {},
    }
  }

  render() {
    const {
      tags,
      favorites,
      updateFavorites,
      openModal,
      favoriteClubs,
    } = this.props

    return (
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

        {!favorites.length ? (
          <p className="has-text-light-grey" style={{ paddingTop: 200 }}>
            No favorites yet! Browse clubs <a href="/">here.</a>
          </p>
        ) : (
          <div />
        )}
      </Wrapper>
    )
  }
}

export default renderListPage(Favorites)
