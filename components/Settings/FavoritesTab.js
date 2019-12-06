import ClubTableRow from '../ClubTableRow'

export default (props) => {
  const { updateFavorites, favorites, clubs } = props

  const findClub = clubs ? code => clubs.find(club => club.code === code) : () => {}

  if (!favorites || !favorites.length) {
    return (
      <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
        No bookmarks yet! Browse clubs <a href="/">here.</a>
      </p>
    )
  }
  return (
    <div>
      {favorites.map((favorite) => (
        <ClubTableRow
          club={findClub(favorite)}
          updateFavorites={updateFavorites}
          openModal={null}
          favorite={true}
          key={favorite}
        />
      ))}
    </div>
  )
}
