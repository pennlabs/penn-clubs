import React from 'react'
import styled from 'styled-components'

const Bar = styled.input`
  width: 100%;
  border-radius: 34px;
  padding: 16px 28px;
  background-color: white;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  outline: none;
  font-size: 18px;
  box-shadow: 0px 2px 6px 0px rgba(89, 97, 104, 0.2);
  border: 0px;
  ::placeholder {
    font: 16px;
    color: #858585;
  }
`
const BarContainer = styled.div`
  input::placeholder {
    font: 16px;
    color: #858585;
  }
  width: 100%;
`

const Searchbar = () => {
  return (
    <BarContainer>
      <Bar placeholder={'Explore Your Favorite Clubs Here'} type="text" />
    </BarContainer>
  )
}

export default Searchbar
