import React from 'react'
import styled from 'styled-components'

const NavContainer = styled.div`
  padding: 25px 50px;
  top: 0px;
  gap: 50px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

const NavWords = styled.div`
  font-size: 18px;
`
const Login = styled.div`
  padding: 10px 20px;
  font-size: 18px;
  background-color: #485beb;
  color: white;
  border-radius: 4px;
  gap: 8px;
`

const Navbar = () => {
  return (
    <NavContainer>
      <NavWords>Clubs</NavWords>
      <NavWords>Events</NavWords>
      <NavWords>Funding</NavWords>
      <NavWords>FAQ</NavWords>
      <Login>Login</Login>
    </NavContainer>
  )
}

export default Navbar
