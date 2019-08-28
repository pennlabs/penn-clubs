import React from 'react'
import { Link } from '../../routes'
import s from 'styled-components'
import { LOGIN_URL } from '../../utils'
import { MEDIUM_GRAY, DARK_GRAY } from '../../constants/colors'

const StyledLink = s.a`
  padding: 14px 20px;
  color: ${MEDIUM_GRAY} !important;

  &:hover {
    color: ${DARK_GRAY} !important;
  }
`

export default ({ userInfo, authenticated }) => (
  <div className="navbar-menu">
    <div className="navbar-end" style={{ padding: '0' }}>
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
