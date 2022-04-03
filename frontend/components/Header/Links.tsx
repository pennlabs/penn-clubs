import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { SHORT_ANIMATION_DURATION } from '../../constants/animations'
import {
  BANNER_BG,
  BANNER_TEXT,
  LOGIN_BACKGROUND,
  WHITE,
  WHITE_ALPHA,
  BORDER
} from '../../constants/colors'
import {
  LINK_MARGIN,
  LOGIN_MARGIN,
  LOGIN_OPACITY,
  MD,
  mediaMaxWidth,
  NAV_HEIGHT,
  HEADER_SHADOW
} from '../../constants/measurements'
import { SETTINGS_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import { LOGIN_URL } from '../../utils'
import { logEvent } from '../../utils/analytics'
import { Icon } from '../common'

const StyledIcon = styled(Icon)`
  opacity: 0.5;
  margin-right: 4px;
`

const LoginButton = styled.a`
  border: 0;
  background-color: ${LOGIN_BACKGROUND};
  padding: 14px 20px;
  margin: auto;
  margin-bottom: ${LOGIN_MARGIN};
  opacity: ${LOGIN_OPACITY};
  color: ${WHITE_ALPHA(0.8)} !important;
  transition: color ${SHORT_ANIMATION_DURATION}ms ease,
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

const CartButton = styled.a`
  border: 0;
  padding: 14px 20px;
  margin: auto;
  margin-bottom: ${LOGIN_MARGIN};
  opacity: ${LOGIN_OPACITY};
  color: ${BANNER_TEXT} !important;
  transition: color ${SHORT_ANIMATION_DURATION}ms ease,
    background ${SHORT_ANIMATION_DURATION}ms ease;

  ${mediaMaxWidth(MD)} {
    padding: 8px 0;
    padding-top: 0.4rem;
    width: 5rem !important;
  }
`

const StyledLinkAnchor = styled.a`
  padding: ${LINK_MARGIN} 20px;
  color: ${BANNER_TEXT} !important;
  display: inline-block;
  cursor: pointer;

  ${mediaMaxWidth(MD)} {
    padding: 14px 0px;
    padding-right: 20px;
  }
`

const DropdownMenu = styled.div`
  position: absolute;
  background: ${BANNER_BG} !important;
  top: ${NAV_HEIGHT};
  border-bottom: 1px solid ${BORDER};
  box-shadow: 0 1px 4px 0 ${BORDER};
  right: 0px;
  width: 150px;
  z-index: 2;
  box-shadow: ${HEADER_SHADOW};

  ${mediaMaxWidth(MD)} {
    box-shadow: none;
  }
`

const DropdownContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const DropdownItemContent = styled.div`
  text-align: left;
  flex-wrap: wrap;
  justify-content: flex-start;
  border-color: #000000;
  border-radius: 5px;
  display: flex;
  flex-direction: row;
  padding: 10px;
`

const DropdownItemTitle = styled.div`

`

const StyledLink = (props): ReactElement => {
  return (
    <Link href={props.href}>
      <StyledLinkAnchor {...props} />
    </Link>
  )
}

const Menu = styled.div<{ show?: boolean }>`
  ${mediaMaxWidth(MD)} {
    ${({ show }) => show && 'display: block;'}
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
const Links = ({ userInfo, authenticated, show }: Props): ReactElement => {
  const router = useRouter()
  const [dropdown, setDropdown] = useState(false)

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
          <StyledLink href={SETTINGS_ROUTE}>
            <StyledIcon name="user" alt="settings" />
            {userInfo.name || userInfo.username}
          </StyledLink>
        )}
        {authenticated === true && (
          <CartButton
            className="button"
            onClick={() => setDropdown(!dropdown)}
          >
            <StyledIcon name="shopping-cart" alt="settings" />
            Cart
          </CartButton>
        )}
        {dropdown &&
          <DropdownMenu>
            <DropdownContent>
              <DropdownItemContent>
                <DropdownItemTitle>Item1</DropdownItemTitle>
              </DropdownItemContent>
              <DropdownItemContent>
                <DropdownItemTitle>Item2</DropdownItemTitle>
              </DropdownItemContent>

            </DropdownContent>
          </DropdownMenu>
        }
      </div>
    </Menu>
  )
}

export default Links
