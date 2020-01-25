import { useState } from 'react'
import Link from 'next/link'
import ClubTableRow from '../ClubTableRow'
import { Center, EmptyState, Text } from '../common'
import { CLUBS_GREY_LIGHT } from '../../constants/colors'

export default ({ clubs = [], favorites, keyword, updateFavorites }) => {
  const [table, setTable] = useState(() => {
    const ret = {}
    favorites.forEach(favorite => {
      ret[favorite] = true
    })
    return ret
  })
  const rows = Object.keys(table)
  const isBookmarksTab = keyword === 'bookmark'
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
        <EmptyState name={isBookmarksTab ? 'bookmarks' : 'subscriptions'} />
        <Center>
          <Text color={CLUBS_GREY_LIGHT}>
            No {keyword}s yet! Browse clubs <Link href="/">here.</Link>
          </Text>
        </Center>
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
