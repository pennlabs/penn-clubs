import React from 'react'
import styled from 'styled-components'

const EventsContainer = styled.div`
  width: 100%;
`

const WordContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
`
const Trending = styled.div`
  font-size: 18px;
`

const SeeMore = styled.div`
  font-weight: 800;
  font-size: 20px;
  color: #485beb;
`

const EventsTrending = () => {
  return (
    <EventsContainer>
      <WordContainer>
        <Trending>Trending Events This Week</Trending>
        <SeeMore>See More</SeeMore>
      </WordContainer>
    </EventsContainer>
  )
}

export default EventsTrending
