import ClubTableRow from '../ClubTableRow'

export default (props) => {
  const { updateFavorites, favorites, clubs } = props

  const findClub = clubs ? code => clubs.find(club => club.code === code) : {}

  return (
    <div>
      {favorites.map((favorite) => (
        <ClubTableRow
          club={findClub(favorite)}
          updateFavorites={updateFavorites}
          openModal={null}
          favorite={true}
        />
      ))}
      {(!favorites.length) ? (
        <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
          No favorites yet! Browse clubs <a href="/">here.</a>
        </p>
      ) : (<div />)}
    </div>
  )
}
