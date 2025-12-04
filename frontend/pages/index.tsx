import { Icon } from 'components/common'
import { DateTime } from 'luxon'
import moment from 'moment'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ReactElement, useEffect, useRef, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { doApiRequest } from 'utils'
import { SITE_LOGO, SITE_NAME } from 'utils/branding'

import {
  ALLBIRDS_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
  H1_TEXT,
  LIGHTER_BLUE,
  SNOW,
  WHITE,
} from '~/constants/colors'
import {
  ANIMATION_DURATION,
  LOGO_SCALE,
  MD,
  mediaMaxWidth,
  PHONE,
} from '~/constants/measurements'
// displayEvents
const displayEvents = (events) => {
  if (!events || events.length === 0) {
    return (
      <>
        <SectionHeader>
          <SectionTitle>No Upcoming Events</SectionTitle>
          <SeeMoreLink href="/events">See More</SeeMoreLink>
        </SectionHeader>
        <p>Check back later for updates on upcoming events!</p>
      </>
    )
  }
  const eventsToShow = events.length > 5 ? events.slice(0, 5) : events
  return (
    <>
      <SectionHeader>
        <SectionTitle>Upcoming Events</SectionTitle>
        <SeeMoreLink href="/events">See More</SeeMoreLink>
      </SectionHeader>

      {eventsToShow.map((event) => (
        <Link key={event.id} href={`/events/${event.id}`}>
          <EventCard>
            <EventImageWrapper>
              <SmallCover
                image={event.image_url || undefined}
                clubImage={(event as any).club_image_url || undefined}
                fallback={
                  <p style={{ textAlign: 'center' }}>
                    <b>{event.name?.toUpperCase() || 'EVENT'}</b>
                  </p>
                }
              />
            </EventImageWrapper>

            <EventInfo>
              <EventClubName>{event.club_name}</EventClubName>
              <EventTitle>{event.name}</EventTitle>
              <EventDate>
                {formatEventDateRange(
                  event.earliest_start_time,
                  event.earliest_end_time,
                )}
              </EventDate>
            </EventInfo>
          </EventCard>
        </Link>
      ))}
    </>
  )
}
const displayClubs = (clubs) => {
  return clubs.map((club) => (
    <Link key={club.code} href={`/club/${club.code}`}>
      <ClubResult>
        <SmallLogo image={club.image_url} name={club.name} />
        <ClubInfo>
          <ClubName>{club.name}</ClubName>
          <ClubTags>
            {club.tags?.slice(0, 3).map((tag) => (
              <ClubTag key={tag.id}>{tag.name}</ClubTag>
            ))}
          </ClubTags>
        </ClubInfo>
      </ClubResult>
    </Link>
  ))
}
const PageContainer = styled.div`
  background-color: ${SNOW};
  min-height: 100vh;
  padding: 2rem 2rem;
  @media (max-width: ${PHONE}) {
    padding: 2rem 0rem;
  }
`

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 3rem;
`

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  gap: 1rem;
`

const Logo = styled.img`
  height: 6rem;
  width: auto;
  transform: scale(${LOGO_SCALE});
  transition: transform ${ANIMATION_DURATION} ease;

  &:hover {
    transform: scale(${parseFloat(LOGO_SCALE) * 1.1});
  }

  ${mediaMaxWidth(MD)} {
    height: 3rem;
  }
`

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${H1_TEXT};
  margin: 0;
  line-height: 1.2;
`

const Subtitle = styled.p`
  font-size: 1rem;
  color: ${CLUBS_GREY_LIGHT};
  margin: 0.5rem 0 2rem 0;
  padding: 0 2rem;
  font-style: italic;
`

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  padding: 0 2rem;
`
const InternalSearchContainer = styled.div`
  border-radius: 25px;
  background-color: ${WHITE};
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`
const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border-radius: 25px;
  border: none;
  font-size: 1rem;
  background-color: ${WHITE};
  &::placeholder {
    color: ${CLUBS_GREY_LIGHT};
  }
  &:focus {
    outline: none;
  }
`

const SearchIcon = styled.button`
  position: absolute;
  right: 2.5rem;
  display: flex;
  top: 17px;
  align-items: start;
  justify-content: center;
  padding-right: 16px;
  border: none;
  background: none;
  color: ${CLUBS_BLUE};
  cursor: pointer;
`

const TrendingSection = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
`

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  @media (max-width: ${PHONE}) {
    flex-wrap: wrap;
    align-items: flex-start;
  }
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${H1_TEXT};
  margin: 0;
`

const SeeMoreLink = styled.a`
  color: ${CLUBS_BLUE};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  &:hover {
    text-decoration: underline;
  }

  @media (max-width: ${PHONE}) {
    display: block;
    flex-basis: 100%;
    margin-top: 0.5rem;
  }
`

const ErrorBanner = styled.div`
  background: #fff3f2;
  color: #9b2c2c;
  border: 1px solid rgba(155, 44, 44, 0.08);
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: ${PHONE}) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
`

const RetryButton = styled.button`
  background: transparent;
  border: none;
  color: ${CLUBS_BLUE};
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  @media (max-width: ${PHONE}) {
    display: block;
    width: auto;
    margin-top: 0;
  }
`

const EventCard = styled.div`
  background-color: ${WHITE};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: box-shadow ${ANIMATION_DURATION}ms ease;
  border: 1px solid ${ALLBIRDS_GRAY};

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: ${PHONE}) {
    flex-direction: column;
    align-items: stretch;
    padding: 0; /* we'll let children control padding so image sits edge-to-edge */
    gap: 0;
  }
`

const EventInfo = styled.div`
  flex: 1;
  padding: 0 0; /* default no extra horizontal padding */

  @media (min-width: ${PHONE}) {
    padding: 0; /* keep behavior on desktop unchanged */
  }

  @media (max-width: ${PHONE}) {
    padding: 0.75rem 1rem; /* content padding when stacked */
  }
`

const EventClubName = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${H1_TEXT};
  margin: 0 0 0.25rem 0;
`
const EventTitle = styled.p`
  font-size: 0.9rem;
  color: ${CLUBS_GREY};
  margin: 0 0 0.5rem 0;
`
const EventDate = styled.p`
  font-size: 0.9rem;
  color: ${CLUBS_GREY_LIGHT};
  margin: 0;
`

const EventImageWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: ${PHONE}) {
    width: 100%;
    height: 160px; /* taller banner image on mobile */
    border-radius: 8px 8px 0 0; /* round top corners only */
    flex-shrink: 0;
    order: -1; /* place image above content when stacked */
  }
`

const SmallCover: React.FC<{
  image?: string
  clubImage?: string
  fallback?: React.ReactNode
}> = ({ image, clubImage, fallback }) => {
  const [eventImageValid, setEventImageValid] = React.useState<boolean | null>(
    null,
  )
  const [clubImageValid, setClubImageValid] = React.useState<boolean | null>(
    null,
  )

  // Check event image first
  React.useEffect(() => {
    if (!image) {
      setEventImageValid(false)
      return
    }

    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setEventImageValid(true)
    }
    img.onerror = () => {
      if (!cancelled) setEventImageValid(false)
    }
    img.src = image

    return () => {
      cancelled = true
    }
  }, [image])

  // If event image is invalid, try club image as fallback
  React.useEffect(() => {
    if (eventImageValid === true || !clubImage) {
      setClubImageValid(null)
      return
    }

    if (eventImageValid === false) {
      let cancelled = false
      const img = new Image()
      img.onload = () => {
        if (!cancelled) setClubImageValid(true)
      }
      img.onerror = () => {
        if (!cancelled) setClubImageValid(false)
      }
      img.src = clubImage

      return () => {
        cancelled = true
      }
    }
  }, [eventImageValid, clubImage])

  // while loading or invalid, show fallback; only render image after successful load
  return (
    <EventImageWrapper>
      {eventImageValid === true ? (
        <img
          src={image}
          alt="cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : clubImageValid === true ? (
        <img
          src={clubImage}
          alt="club cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <EventFallbackLogo>{fallback}</EventFallbackLogo>
      )}
    </EventImageWrapper>
  )
}

// SmallLogo: preloads a club's logo image; shows ClubLogo fallback while loading or if image invalid
const SmallLogo: React.FC<{ image?: string; name?: string }> = ({
  image,
  name,
}) => {
  const [isValid, setIsValid] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (!image) {
      setIsValid(false)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setIsValid(true)
    }
    img.onerror = () => {
      if (!cancelled) setIsValid(false)
    }
    img.src = image
    return () => {
      cancelled = true
    }
  }, [image])

  if (isValid) {
    return (
      <img
        src={image}
        alt={`${name} Logo`}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: 8,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  // fallback: first letter
  return <ClubLogo>{name?.charAt(0)?.toUpperCase() || 'C'}</ClubLogo>
}

const NoResults = styled.div`
  padding: 1rem 1.25rem;
  color: ${CLUBS_GREY_LIGHT};
  font-size: 0.95rem;
  border-radius: 8px;
  border-top: 1px solid #f0f0f0;
`

const NoResultsTitle = styled.div`
  font-weight: 700;
  color: ${H1_TEXT};
`

const ClubResult = styled.div`
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  gap: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.08s ease;

  &:hover {
    background-color: ${LIGHTER_BLUE};
    transform: translateY(-1px);
  }
`

const ClubResultsContainer = styled.div`
  /* only apply rounding/styling to the actual last result element */
  & > *:last-child ${ClubResult} {
    border-bottom: none;
    border-radius: 0 0 16px 16px;
  }

  & > *:last-child ${ClubResult}:hover {
    transform: none;
  }
`

const ClubLogo = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background-color: ${CLUBS_BLUE};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${WHITE};
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
`

// 80x80 fallback box matching ClubLogo colors for event thumbnails
const EventFallbackLogo = styled(ClubLogo)`
  width: 80px;
  height: 80px;
  font-size: 0.95rem;
  border-radius: 8px;
  padding: 0.5rem;
  box-sizing: border-box;

  @media (max-width: ${PHONE}) {
    width: 100%;
    height: 160px;
    padding: 0;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const ClubInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
`

const ClubName = styled.h4`
  font-size: 1.125rem;
  text-align: left;
  font-weight: 700;
  color: ${H1_TEXT};
  margin: 0;
  line-height: 1.2;
`

const ClubTags = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const ClubTag = styled.span`
  background-color: rgba(74, 106, 255, 0.12);
  color: ${CLUBS_BLUE};
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
`

function formatEventDateRange(startISO, endISO) {
  const start = moment(startISO)
  const end = moment(endISO)

  if (!start.isValid() || !end.isValid()) {
    return 'Invalid date range'
  }

  const startWeekday = start.format('dddd')
  const startDate = start.format('MMM D')
  const endWeekday = end.format('dddd')
  const endDate = end.format('MMM D')

  // If the range is on the same date
  if (startDate === endDate) {
    return `${startWeekday}, ${startDate}`
  } else if (start.month() === end.month()) {
    // Same month, show both dates with weekdays
    return `${startWeekday}, ${startDate} – ${endWeekday}, ${endDate}`
  } else {
    // Different months, show full date for both
    return `${startWeekday}, ${startDate} – ${endWeekday}, ${endDate}`
  }
}

// same default date range used by pages/events
const getDefaultDateRange = () => ({
  start: DateTime.local().startOf('day').minus({ days: 6 }),
  end: DateTime.local().startOf('day').plus({ month: 1, days: 6 }),
})

const Splash = (): ReactElement<any> => {
  const [trendingEvents, setTrendingEvents] = useState([])
  const [clubs, setClubs] = useState([])
  const [clubsError, setClubsError] = useState<string | null>(null)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [clubSearchValue, setClubSearchValue] = useState('')
  const [clubSearchInput, setClubSearchInput] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [clubsChanged, setClubsChanged] = useState(false)
  const searchTimeout = useRef<number | null>(null)
  const router = useRouter()

  const retryClubs = async () => {
    setClubsError(null)
    try {
      const response = await doApiRequest('/clubs/?format=json&page=1', {
        method: 'GET',
      })
      const data = await response.json()
      if (data.length === 0) return
      setClubs(data.results?.slice(0, 4))
    } catch (e) {
      setClubsError('Could not load clubs. Please try again.')
    }
  }

  const retryEvents = async () => {
    setEventsError(null)
    try {
      const response = await doApiRequest('/events/')
      if (response.ok) {
        const data = await response.json()
        setTrendingEvents(data)
      } else {
        setEventsError('Could not load events. Please try again.')
      }
    } catch (e) {
      setEventsError('Could not load events. Please try again.')
    }
  }
  useEffect(() => {
    const fetchTrendingEvents = async () => {
      try {
        const { start, end } = getDefaultDateRange()
        // is currently lax on timings: doesn't technically check if a single EventShowing actually happens in the time range
        // only that there are events in the vincinity (edge case where time range is between two events in the past and distant future)
        const params = new URLSearchParams({
          // eslint-disable-next-line camelcase
          latest_start_time__gte: start.toISO(),
          // eslint-disable-next-line camelcase
          earliest_end_time__lte: end.toISO(),
          format: 'json',
        })
        const response = await doApiRequest(`/events/?${params.toString()}`, {
          method: 'GET',
        })
        const data = await response.json()
        setTrendingEvents(data)
        setEventsError(null)
      } catch (error) {
        // Handle error silently or show user-friendly message
        setTrendingEvents([])
        setEventsError('Could not load events. Server may be down.')
      }
    }
    fetchTrendingEvents()
  }, [])

  // Debounced club search
  useEffect(() => {
    if (searchTimeout.current != null) {
      window.clearTimeout(searchTimeout.current)
    }
    searchTimeout.current = window.setTimeout(() => {
      setClubSearchValue(clubSearchInput)
    }, 300)

    return () => {
      if (searchTimeout.current != null) {
        window.clearTimeout(searchTimeout.current)
      }
    }
  }, [clubSearchInput])

  // Fetch clubs based on search
  useEffect(() => {
    const fetchClubs = async () => {
      // do not call the API if the search value is empty
      if (!clubSearchValue || clubSearchValue.trim().length === 0) {
        setClubs([])
        return
      }
      try {
        const params = new URLSearchParams({
          format: 'json',
          page: '1',
          ...(clubSearchValue && { search: clubSearchValue }),
        })

        const response = await doApiRequest(`/clubs/?${params.toString()}`, {
          method: 'GET',
        })
        const data = await response.json()
        if (clubs.length !== 0 && data.results.length !== 0) {
          setClubsChanged(false)
        }
        setClubsError(null)
        setClubs(data.results?.slice(0, 4))
      } catch (error) {
        // Handle error silently
        setClubs([])
        setClubsError('Search failed. Please try again.')
      }
      setClubsChanged(true)
    }

    fetchClubs()
  }, [clubSearchValue])
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    performSearch()
  }

  // perform the search navigation logic (shared by Enter key and search icon click)
  const performSearch = () => {
    const q = clubSearchInput.trim()
    if (!q) return

    if (clubs && clubs.length === 1) {
      const only = (clubs as any)[0]
      if (only && only.code) {
        router.push(`/club/${only.code}`)
        return
      }
    }

    router.push(`/clubs?search=${encodeURIComponent(q)}`)
  }
  const handleInputChange = (text) => {
    if (text.length === 0) {
      setClubsChanged(false)
    }
    setClubSearchInput(text)
  }
  return (
    <PageContainer>
      <HeaderSection>
        <LogoContainer>
          <Logo src={SITE_LOGO} alt={`${SITE_NAME} Logo`} />
          <Title>{SITE_NAME}</Title>
        </LogoContainer>
        <Subtitle>
          Student Organizations at the University of Pennsylvania
        </Subtitle>
        <SearchContainer>
          <InternalSearchContainer>
            <SearchInput
              aria-label="Search clubs"
              placeholder="Explore Your Favorite Clubs Here"
              value={clubSearchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <SearchIcon onClick={performSearch}>
              <Icon name="search" size="1.2rem" />
            </SearchIcon>
            {clubsError && (
              <ErrorBanner>
                <div>{clubsError}</div>
                <RetryButton onClick={retryClubs}>Retry</RetryButton>
              </ErrorBanner>
            )}
            {isSearchFocused &&
              !clubsError &&
              clubSearchInput.trim().length > 0 && (
                <ClubResultsContainer onMouseDown={(e) => e.preventDefault()}>
                  {clubs && clubs.length > 0 ? (
                    displayClubs(clubs)
                  ) : clubsChanged ? (
                    <NoResults>
                      <NoResultsTitle>No clubs found</NoResultsTitle>
                      <p>We couldn't find any clubs matching your search.</p>
                      <a href={`/clubs`}>See all clubs</a>
                    </NoResults>
                  ) : (
                    <></>
                  )}
                </ClubResultsContainer>
              )}
          </InternalSearchContainer>
        </SearchContainer>
      </HeaderSection>
      <TrendingSection>
        {eventsError ? (
          <ErrorBanner>
            <div>{eventsError}</div>
            <RetryButton onClick={retryEvents}>Retry</RetryButton>
          </ErrorBanner>
        ) : (
          displayEvents(trendingEvents)
        )}
      </TrendingSection>
    </PageContainer>
  )
}

export default renderPage(Splash)
