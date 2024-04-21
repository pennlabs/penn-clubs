import styled from 'styled-components'

import EventsTrending from '~/components/Frontpage/EventsTrending'
import Navbar from '~/components/Frontpage/Navbar'
import Searchbar from '~/components/Frontpage/Searchbar'
const PageContainer = styled.div`
  background-color: #f5f7fd;
  min-height: 100vh;
`

const TopContainer = styled.div`
  gap: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  margin: auto;
  align-items: center;
  width: 100%;
`
const ContentContainer = styled.div`
  top: 65px;
  display: flex;
  flex-direction: column;
  gap: 50px;
  position: relative;
  align-items: center;
  width: 600px;
  margin: auto;
`

const frontpage = () => {
  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <TopContainer>
          <img src="./static/img/f20.png" width={'280px'}></img>
          <Searchbar />
        </TopContainer>
        <EventsTrending />
      </ContentContainer>
    </PageContainer>
  )
}

export default frontpage
