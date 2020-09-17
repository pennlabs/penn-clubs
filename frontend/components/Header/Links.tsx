import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement } from 'react'
import s from 'styled-components'

import { SHORT_ANIMATION_DURATION } from '../../constants/animations'
import {
  BORDER,
  CLUBS_NAVY,
  CLUBS_RED,
  CLUBS_RED_DARK,
  WHITE,
  WHITE_ALPHA,
} from '../../constants/colors'
import { MD, mediaMaxWidth } from '../../constants/measurements'
import { SETTINGS_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import { LOGIN_URL } from '../../utils'
import { logEvent } from '../../utils/analytics'
import { Icon } from '../common'

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

const StyledLinkAnchor = s.a`
  padding: 14px 20px;
  color: ${CLUBS_NAVY} !important;
  display: inline-block;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    text-align: center;
    padding: 8px 0;
  }
`

const StyledLink = (props) => {
  <Link>
    <StyledLinkAnchor {...props} />
  </Link>
}

const Menu = s.div<{ show?: boolean }>`
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

type Props = {
  userInfo?: UserInfo
  authenticated: boolean | null
  show?: boolean
}

/**
 * Checks authenticated === false to confirm browser has loaded and user is not logged in.
 * Will be undefined if browser has not loaded and true is browser has loaded and user is logged in.
 */
const Links = ({ userInfo, authenticated, show }: Props): ReactElement => {
  const router = useRouter()
  return (
    <Menu className="navbar-menu" show={show}>
      <div className="navbar-end" style={{ padding: '0 1rem' }}>
        <StyledLink href="/events" onClick={() => logEvent('events', 'click')}>
          Events
        </StyledLink>
        <StyledLink href="/faq" onClick={() => logEvent('faq', 'click')}>
          FAQ
        </StyledLink>
        {authenticated === false && (
          <LoginButton
            className="button"
            href={`${LOGIN_URL}?next=${router.asPath}`}
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
}

export default Links
