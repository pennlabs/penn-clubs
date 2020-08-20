import { ReactElement, useEffect, useRef, useState } from 'react'

import { PaginatedClubPage } from '../renderPage'
import { Club, Tag } from '../types'
import { doApiRequest } from '../utils'
import ClubDisplay from './ClubDisplay'
import { Loading } from './common'

type ClubDisplayProps = {
  displayClubs: PaginatedClubPage
  tags: Tag[]
  display: string
}

const PaginatedClubDisplay = ({
  displayClubs,
  tags,
  display,
}: ClubDisplayProps): ReactElement => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [clubs, setClubs] = useState<Club[]>(displayClubs.results)
  const nextUrl = useRef<string | null>(displayClubs.next)

  const loadLock = useRef<boolean>(false)
  const loadNumber = useRef<number>(0)
  const loadQueue = useRef<number[]>([])

  const fetchNextPage = async (): Promise<void> => {
    const myLoadNumber = loadNumber.current

    if (loadQueue.current.includes(myLoadNumber)) {
      return
    }

    if (nextUrl !== null) {
      loadQueue.current.push(myLoadNumber)
    }

    if (!loadLock.current) {
      loadLock.current = true
      setLoading(true)

      // get valid fetch entry and go through queue
      while (loadQueue.current) {
        let num = loadQueue.current.shift()
        while (loadQueue.current.length && num !== loadNumber.current) {
          num = loadQueue.current.shift()
        }

        if (num !== loadNumber.current) {
          break
        }

        if (nextUrl.current === null) {
          break
        }

        // fetch the entry
        const resp = await doApiRequest(nextUrl.current)
        const json = await resp.json()

        // if we're still up to date, set the entry
        if (myLoadNumber === loadNumber.current) {
          nextUrl.current = json.next
          setClubs((clubs) => [...clubs, ...json.results])
        }
      }

      setLoading(false)
      loadLock.current = false
    }
  }

  useEffect(() => {
    loadNumber.current += 1
    setClubs(displayClubs.results)
    nextUrl.current = displayClubs.next
    fetchNextPage()
  }, [displayClubs])

  return (
    <>
      <ClubDisplay
        displayClubs={clubs}
        tags={tags}
        display={display}
        onScroll={fetchNextPage}
      />
      {isLoading && <Loading delay={0} />}
    </>
  )
}

export default PaginatedClubDisplay
