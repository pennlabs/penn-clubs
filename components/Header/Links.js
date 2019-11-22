import s from 'styled-components'
import Link from 'next/link'

import { Icon } from '../common'
import { LOGIN_URL } from '../../utils'
import { mediaMaxWidth, MD } from '../../constants/measurements'
import { MEDIUM_GRAY, DARK_GRAY, BORDER } from '../../constants/colors'
import { logEvent } from '../../utils/analytics'

const StyledLink = s.a`
  padding: 14px 20px;
  color: ${MEDIUM_GRAY} !important;
  display: inline-block;
  cursor: pointer;

  &:hover {
    color: ${DARK_GRAY} !important;
  }

  ${mediaMaxWidth(MD)} {
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
    <div className="navbar-end" style={{ padding: '0px 20px' }}>
      <Link href="/faq" onClick={() => logEvent('faq', 'click')}>
        <StyledLink>FAQ</StyledLink>
      </Link>
      {authenticated === false && (
        <a
          href={`${LOGIN_URL}?next=${window.location.href}`}
          onClick={() => logEvent('login', 'click')}
        >
          <StyledLink>Login</StyledLink>
        </a>
      )}
      {userInfo && (
        <Link href="/settings">
          <StyledLink>
            <Icon
              name="user"
              alt="settings"
              style={{ opacity: 0.5, marginRight: '4px' }}
            />
            {userInfo.name || userInfo.username}
          </StyledLink>
        </Link>
      )}
    </div>
  </Menu>
)
