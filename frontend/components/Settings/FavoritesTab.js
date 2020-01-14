import { useState } from 'react'
import Link from 'next/link'
import ClubTableRow from '../ClubTableRow'

export default ({ clubs = [], favorites, keyword, updateFavorites }) => {
  const [table, setTable] = useState(() => {
    const ret = {}
    favorites.forEach(favorite => {
      ret[favorite] = true
    })
    return ret
  })
  const rows = Object.keys(table)
  const findClub = code => {
    return clubs.find(club => club.code === code) || {}
  }
  const toggleFavorite = code => {
    setTable({ ...table, [code]: !table[code] })
    updateFavorites(code)
  }

  if (!rows || !rows.length) {
    return (
      <p className="has-text-light-grey" style={{ paddingTop: 200, textAlign: 'center' }}>
        No {keyword}s yet! Browse clubs <Link href="/">here.</Link>
      </p>
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
