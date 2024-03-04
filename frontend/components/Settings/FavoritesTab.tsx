import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'

import { CLUBS_GREY_LIGHT } from '../../constants/colors'
import { HOME_ROUTE } from '../../constants/routes'
import { Club } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_PLURAL } from '../../utils/branding'
import ClubTableRow from '../ClubTableRow'
import { Center, EmptyState, Loading, Text } from '../common'

type FavoritesTabProps = {
  keyword: 'bookmark' | 'subscription'
}

const FavoritesTab = ({ keyword }: FavoritesTabProps): ReactElement => {
  const [favorites, setFavorites] = useState<Club[]>([])
  const [isLoading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    doApiRequest(
      `/${keyword === 'bookmark' ? 'favorite' : 'subscription'}s/?format=json`,
    )
      .then((res) => res.json())
      .then((values) => {
        setFavorites(values.map((relation) => relation.club))
        setLoading(false)
      })
  }, [])

  if (isLoading) {
    return <Loading />
  }

  if (!favorites.length) {
    return (
      <>
        <EmptyState name={`${keyword}s`} />
        <Center>
          <Text color={CLUBS_GREY_LIGHT}>
            No {keyword}s yet! Browse {OBJECT_NAME_PLURAL}{' '}
            <Link href={HOME_ROUTE}>here</Link>.
          </Text>
        </Center>
      </>
    )
  }

  return (
    <div>
      {favorites.map((club) => (
        <ClubTableRow club={club} key={club.code} />
      ))}
    </div>
  )
}

export default FavoritesTab
