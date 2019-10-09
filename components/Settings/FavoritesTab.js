import ClubTableRow from '../ClubTableRow'

export default (props) => {
  const { favoriteClubs, updateFavorites, favorites } = props
  return (
    <div>
      {favoriteClubs.map((club) => (
        <ClubTableRow
          club={club}
          updateFavorites={updateFavorites}
          openModal={null}
          favorite={favorites.includes(club.code)}
        />
      ))}

      {(!favoriteClubs.length) ? (
        <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
          No favorites yet! Browse clubs <a href="/">here.</a>
        </p>
      ) : (<div />)}
    </div>
  )
}
