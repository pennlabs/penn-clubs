import { useState } from 'react'
import ClubTableRow from '../ClubTableRow'

export default ({ clubs, favorites, keyword, updateFavorites }) => {
  const [table, setTable] = useState(() => {
    const ret = {}
    favorites.forEach(favorite => { ret[favorite] = true })
    return ret
  })
  const findClub = clubs ? code => clubs.find(club => club.code === code) : () => {}
  const toggleFavorite = code => {
    setTable({ ...table, [code]: !table[code] })
    updateFavorites(code)
  }

  if (!favorites || !favorites.length) {
    return (
      <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
        No {keyword}s yet! Browse clubs <a href="/">here.</a>
      </p>
    )
  }
  return (
    <div>
      {Object.keys(table).map((favorite) => (
        <ClubTableRow
          club={findClub(favorite)}
          updateFavorites={toggleFavorite}
          favorite={table[favorite]}
          key={favorite}
        />
      ))}
    </div>
  )
}
