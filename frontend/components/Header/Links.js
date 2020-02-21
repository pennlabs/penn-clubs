import Link from 'next/link'
import s from 'styled-components'

import { Icon } from '../common'
import { LOGIN_URL, getCurrentRelativePath } from '../../utils'
import { mediaMaxWidth, MD } from '../../constants/measurements'
import {
  WHITE,
  WHITE_ALPHA,
  CLUBS_RED,
  CLUBS_RED_DARK,
  CLUBS_NAVY,
  BORDER,
} from '../../constants/colors'
import { SHORT_ANIMATION_DURATION } from '../../constants/animations'
import { SETTINGS_ROUTE } from '../../constants/routes'
import { logEvent } from '../../utils/analytics'

const StyledIcon = s(Icon)`
  opacity: 0.5;
  margin-right: 4px;
`

const LoginButton = s.a`
  border: 0;
  background-color: ${CLUBS_RED};
  padding: 14px 20px;
  margin: auto;
  color: ${WHITE_ALPHA(0.8)} !important;
  transition: color ${SHORT_ANIMATION_DURATION}ms ease,
              background ${SHORT_ANIMATION_DURATION}ms ease;

  &:hover,
  &:focus,
  &:active {
    background-color: ${CLUBS_RED_DARK};
    color: ${WHITE} !important;
  }

  ${mediaMaxWidth(MD)} {
    padding: 8px 0;
    padding-top: 0.4rem;
    width: 5rem !important;
  }
`

const StyledLink = s.a`
  padding: 14px 20px;
  color: ${CLUBS_NAVY} !important;
  display: inline-block;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    text-align: center;
    padding: 8px 0;
  }
`

const Menu = s.div`
  ${mediaMaxWidth(MD)} {
    border-top: 1px solid ${BORDER};
    box-shadow: 0 4px 4px ${BORDER};

    a {
      display: block;
      width: 100%;
    }

    ${({ show }) => show && 'display: block;'}
  }
`
// Checks authenticated === false to confirm browser has loaded and user is not logged in. Will be undefined if browser has not loaded and true is browser has loaded and user is logged in.
export default ({ userInfo, authenticated, show }) => (
  <Menu className="navbar-menu" show={show}>
    <div className="navbar-end" style={{ padding: '0 1rem' }}>
      <StyledLink href="/faq" onClick={() => logEvent('faq', 'click')}>
        FAQ
      </StyledLink>
      <StyledLink href="/changelog" onClick={() => logEvent('changelog', 'click')}>
        Changelog
      </StyledLink>
      {authenticated === false && (
        <LoginButton
          className="button"
          href={`${LOGIN_URL}?next=${getCurrentRelativePath()}`}
          onClick={() => logEvent('login', 'click')}
        >
          Login
        </LoginButton>
      )}
      {userInfo && (
        <Link href={SETTINGS_ROUTE}>
          <StyledLink>
            <StyledIcon name="user" alt="settings" />
            {userInfo.name || userInfo.username}
          </StyledLink>
        </Link>
      )}
    </div>
  </Menu>
)
