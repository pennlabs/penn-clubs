import { useState, useEffect } from 'react'
import Link from 'next/link'
import ClubTableRow from '../ClubTableRow'
import { Center, EmptyState, Text, Loading } from '../common'
import { HOME_ROUTE } from '../../constants/routes'
import { CLUBS_GREY_LIGHT } from '../../constants/colors'
import { doApiRequest } from '../../utils'

export default ({ favorites, keyword, updateFavorites }) => {
  const [table, setTable] = useState(() => {
    const ret = {}
    favorites.forEach(favorite => {
      ret[favorite] = true
    })
    return ret
  })

  // load clubs
  const [clubs, setClubs] = useState({})
  useEffect(() => {
    Promise.all(
      favorites.map(club =>
        doApiRequest(`/clubs/${club}/?format=json`).then(res => res.json())
      )
    ).then(values => {
      const newClubs = {}
      values.forEach(item => (newClubs[item.code] = item))
      setClubs(newClubs)
    })
  }, [favorites])

  const rows = Object.keys(table)
  const isBookmarksTab = keyword === 'bookmark'
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
            No {keyword}s yet! Browse clubs <Link href={HOME_ROUTE}>here.</Link>
          </Text>
        </Center>
      </>
    )
  }

  const loadedRows = rows.filter(fav => fav in clubs)

  if (!loadedRows.length) {
    return <Loading />
  }

  return (
    <div>
      {loadedRows.map(favorite => (
        <ClubTableRow
          club={clubs[favorite]}
          updateFavorites={toggleFavorite}
          favorite={table[favorite]}
          key={favorite}
        />
      ))}
    </div>
  )
}
