import { useState, useEffect } from 'react'
import s from 'styled-components'

import renderPage from '../renderPage.js'
import { Sidebar } from '../components/common/Sidebar'
import { Container, WideContainer } from '../components/common/Container'
import { CLUBS_GREY } from '../constants/colors'


const Reports = ({query, userInfo, favorites, updateFavorites}) => {
  return (
    <div>
      <Sidebar>
        Sidebar! 
      </Sidebar>        
      <Container>
        <WideContainer>
          <p className="title" style={{ color: CLUBS_GREY }}>
            Create a new report 
          </p>
        </WideContainer>
      </Container>
    </div>
  )
}

export default renderPage(Reports)