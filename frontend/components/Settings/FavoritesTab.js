import { useState } from 'react'
import ClubTableRow from '../ClubTableRow'
import { EmptyState } from '../common'

export default ({ clubs = [], favorites, keyword, updateFavorites }) => {
  const [table, setTable] = useState(() => {
    const ret = {}
    favorites.forEach(favorite => {
      ret[favorite] = true
    })
    return ret
  })
  const rows = Object.keys(table)
  const isBookmarks = keyword === "bookmark"
  const findClub = code => {
    return clubs.find(club => club.code === code) || {}
  }
  const toggleFavorite = code => {
    setTable({ ...table, [code]: !table[code] })
    updateFavorites(code)
  }

  if (!rows || !rows.length) {
    return (
      <>
        <EmptyState name={isBookmarks ? 'bookmarks' : 'subscriptions'} />
        <p className="has-text-light-grey" style={{ textAlign: 'center' }}>
          No {keyword}s yet! Browse clubs <a href="/">here.</a>
        </p>
      </>
    )
  }
  return (
    <div>
      {rows.map((favorite) => (
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
