import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { SHORT_ANIMATION_DURATION } from '../../constants/animations'
import {
  BANNER_BG,
  BANNER_TEXT,
  LOGIN_BACKGROUND,
  WHITE,
  WHITE_ALPHA,
} from '../../constants/colors'
import {
  LINK_MARGIN,
  LOGIN_MARGIN,
  LOGIN_OPACITY,
  MD,
  mediaMaxWidth,
} from '../../constants/measurements'
import { CART_ROUTE, SETTINGS_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import { LOGIN_URL } from '../../utils'
import { logEvent } from '../../utils/analytics'
import { Icon } from '../common'

const StyledIcon = styled(Icon)`
  opacity: 0.5;
  display: inline-block;
`

const LoginButton = styled.a`
  border: 0;
  background-color: ${LOGIN_BACKGROUND};
  padding: 14px 20px;
  margin: auto;
  margin-bottom: ${LOGIN_MARGIN};
  opacity: ${LOGIN_OPACITY};
  color: ${WHITE_ALPHA(0.8)} !important;
  transition:
    color ${SHORT_ANIMATION_DURATION}ms ease,
    background ${SHORT_ANIMATION_DURATION}ms ease;

  &:hover,
  &:focus,
  &:active {
    background-color: ${LOGIN_BACKGROUND};
    color: ${WHITE} !important;
  }

  ${mediaMaxWidth(MD)} {
    padding: 8px 0;
    padding-top: 0.4rem;
    width: 5rem !important;
  }
`

export const MobileLoginButton = styled(LoginButton)`
  display: none;
  margin-right: 0;
  ${mediaMaxWidth(MD)} {
    display: inline-flex;
  }
`
const DesktopLoginButton = styled(LoginButton)`
  margin-left: 20px;
  ${mediaMaxWidth(MD)} {
    display: none;
  }
`

const StyledLinkAnchor = styled.a`
  padding: ${LINK_MARGIN} 20px;
  color: ${BANNER_TEXT} !important;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;

  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    padding: 14px 0px;
    padding-right: 20px;
  }
`

const StyledLink = (props): ReactElement<any> => {
  return (
    <Link href={props.href} legacyBehavior>
      <StyledLinkAnchor {...props} />
    </Link>
  )
}

const Menu = styled.div<{ $show?: boolean }>`
  ${mediaMaxWidth(MD)} {
    ${({ $show }) => $show && 'display: block;'}
  }

  background-color: ${BANNER_BG};
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
const Links = ({ userInfo, authenticated, show }: Props): ReactElement<any> => {
  const router = useRouter()
  return (
    <Menu className="navbar-menu" $show={show}>
      <div className="navbar-end" style={{ padding: '0 1rem' }}>
        <StyledLink href="/events" onClick={() => logEvent('events', 'click')}>
          Events
        </StyledLink>
        <StyledLink
          href="https://penncfa.com/"
          onClick={() => logEvent('cfa redirect', 'click')}
          target="_blank"
          rel="noopener noreferrer"
        >
          Funding
        </StyledLink>
        <StyledLink href="/faq" onClick={() => logEvent('faq', 'click')}>
          FAQ
        </StyledLink>
        {authenticated === false && (
          <DesktopLoginButton
            className="button"
            href={`${LOGIN_URL}?next=${router.asPath}`}
            onClick={() => logEvent('login', 'click')}
          >
            Login
          </DesktopLoginButton>
        )}
        {authenticated && userInfo && (
          <StyledLink href={SETTINGS_ROUTE}>
            <StyledIcon
              name="user"
              alt="settings"
              style={{
                marginRight: '0.5rem',
              }}
            />
            {userInfo.name || userInfo.username}
          </StyledLink>
        )}
        {authenticated === true && (
          <StyledLink href={CART_ROUTE}>
            <StyledIcon
              name="shopping-cart"
              alt="settings"
              style={{
                marginRight: '0.5rem',
              }}
            />
            Cart
          </StyledLink>
        )}
      </div>
    </Menu>
  )
}

export default Links
