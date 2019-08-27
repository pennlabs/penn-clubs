import React from 'react'
import { Link } from '../../routes'
import s from 'styled-components'
import { LOGIN_URL } from '../../utils'

const StyledLink = s.a`
  padding: 20px;
  color: #9B9B9B;
`

export default ({ userInfo, authenticated }) => (
  <div className="navbar-menu">
    <div className="navbar-end" style={{ padding: '0px 20px' }}>
      <StyledLink href="/faq">
        FAQ
      </StyledLink>
      <StyledLink href="/favorites">
        Favorites
      </StyledLink>
      {(authenticated === false) && (
        <StyledLink href={`${LOGIN_URL}?next=${window.location.href}`}>Login</StyledLink>
      )}
      {userInfo && (
        <Link route='settings'>
          <StyledLink>
            <i className='fa fa-fw fa-user'></i>
            {userInfo.name || userInfo.username}
          </StyledLink>
        </Link>
      )}
    </div>
  </div>
)
