import {
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
  StrongText,
  Text,
} from 'components/common'
import equal from 'deep-equal'
import { ReactElement, useEffect, useRef, useState } from 'react'
import { PaginatedClubPage, renderListPage } from 'renderPage'

import RankDropdown from '~/components/ClubRank/RankDropdown'
import AuthPrompt from '~/components/common/AuthPrompt'
import PaginatedClubDisplay from '~/components/PaginatedClubDisplay'
import { SearchInput } from '~/components/SearchBar'
import { SNOW } from '~/constants/colors'
import { doApiRequest } from '~/utils'

import { ListLoadIndicator, SplashProps } from '.'

const TopSearchBar = ({ onChange }): ReactElement => {
  const searchTimeout = useRef<number | null>(null)
  const [searchValue, setSearchValue] = useState<string>('')

  const updateSearchValue = (value: string): void => {
    if (searchTimeout.current != null) {
      window.clearTimeout(searchTimeout.current)
    }
    setSearchValue(value)
    searchTimeout.current = window.setTimeout(() => {
      searchTimeout.current = null
      onChange(value)
    }, 100)
  }

  return (
    <div className="control has-icons-right">
      <input
        className="input"
        placeholder={`Search for clubs`}
        value={searchValue}
        onChange={(e) => updateSearchValue(e.target.value)}
      />
      {searchValue.length > 0 && (
        <span
          className="icon is-small is-right"
          onClick={() => {
            setSearchValue('')
            onChange('')
          }}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        >
          <Icon name="x" />
        </span>
      )}
    </div>
  )
}

function Rank(props: SplashProps): ReactElement {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<SearchInput>({})
  const [clubs, setClubs] = useState<PaginatedClubPage>(props.clubs)
  const currentSearch = useRef<SearchInput>({})
  useEffect(() => {
    ;(async () => {
      if (equal(searchInput, currentSearch.current)) {
        return
      }
      await search()
    })()
  }, [searchInput])

  async function search() {
    currentSearch.current = { ...searchInput }
    const paramsObject = {
      format: 'json',
      page: '1',
      ...searchInput,
    }

    ;(async () => {
      setLoading(true)
      const params = new URLSearchParams(paramsObject)
      const displayClubs = await doApiRequest(
        `/clubrank/?${params.toString()}`,
        {
          method: 'GET',
        },
      ).then((res) => res.json())
      if (equal(currentSearch.current, searchInput)) {
        setClubs(displayClubs)
      }
      setLoading(false)
    })()
  }

  if (!props.userInfo) {
    return <AuthPrompt title="Sorry, you must be logged in to use Club Rank." />
  }
  return (
    <Container background={SNOW}>
      <Metadata title="Penn Club Rank" />
      <InfoPageTitle>Penn Club Rank</InfoPageTitle>
      <StrongText>Rank your favorite clubs!</StrongText>
      <Text>
        Inspired by <i>wholesome</i> websites such as prestigehunt and
        GreekRank, we've decided to take a crack at making our own club ranking
        system. Clubs (with {'>'}15 members on Penn Clubs) are ranked and given
        "tiers" based on head-to-head votes by the Penn community.
        <br />
        <br /> Users can vote every three seconds. Good luck!
      </Text>
      <RankDropdown onReloadRankings={search} />
      <div style={{ height: '20px' }} />
      <TopSearchBar
        onChange={(value) =>
          setSearchInput((inpt) => ({ ...inpt, search: value }))
        }
      />

      {isLoading || !clubs ? (
        <ListLoadIndicator />
      ) : (
        <PaginatedClubDisplay
          displayClubs={clubs}
          display="list"
          tags={props.tags}
          ranked
        />
      )}
    </Container>
  )
}

export default renderListPage(Rank, 'clubrank')
