import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { LOGIN_URL } from '~/utils'
import { logEvent } from '~/utils/analytics'

import { BANNER_BG, BANNER_TEXT, BORDER } from '../../constants/colors'
import {
  ANIMATION_DURATION,
  BANNER_HEIGHT,
  FULL_NAV_HEIGHT,
  HEADER_SHADOW,
  LOGO_SCALE,
  MD,
  mediaMaxWidth,
  NAV_HEIGHT,
  PHONE,
  TITLE_MARGIN,
  TITLE_SIZE,
  TITLE_SPACING,
  TITLE_WEIGHT,
} from '../../constants/measurements'
import { HOME_ROUTE } from '../../constants/routes'
import { UserInfo } from '../../types'
import {
  HEADER_BACKGROUND_IMAGE,
  LOGO_BACKGROUND_IMAGE,
  SHOW_FEEDBACK,
  SITE_ID,
  SITE_LOGO,
  SITE_NAME,
} from '../../utils/branding'
import Burger from './Burger'
import Feedback from './Feedback'
import Heading from './Head'
import Links, { MobileLoginButton } from './Links'

const Nav = styled.nav`
  height: ${NAV_HEIGHT};
  background-color: ${BANNER_BG} !important;
  border-bottom: 1px solid ${BORDER};
  box-shadow: 0 1px 4px 0 ${BORDER};
  width: 100%;
  position: fixed;
  z-index: 1001;
  box-shadow: ${HEADER_SHADOW};

  ${mediaMaxWidth(MD)} {
    box-shadow: none;
  }
`

const ImageHead = styled.div`
  height: ${BANNER_HEIGHT};
  background-color: ${BANNER_BG};
  background-image: url('${HEADER_BACKGROUND_IMAGE}');
  box-shadow: 0 1px 4px 0 ${BORDER};
  width: 100%;
  position: absolute;
  top: ${NAV_HEIGHT};
  z-index: 999;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  padding: 1em;

  ${mediaMaxWidth(MD)} {
    box-shadow: none;
  }
`

const NavSpacer = styled.div`
  width: 100%;
  display: block;
  height: ${FULL_NAV_HEIGHT};
`

const Logo = styled.img`
  padding-left: 20px;
  height: 100%;
  transform: scale(${LOGO_SCALE});
  transition: transform ${ANIMATION_DURATION} ease;

  &:hover {
    transform: scale(${parseFloat(LOGO_SCALE) * 1.1});
  }

  ${mediaMaxWidth(MD)} {
    padding-left: 1rem;
  }
`

const Title = styled.h1`
  color: ${BANNER_TEXT};
  padding-left: ${TITLE_MARGIN};
  margin-bottom: 0 !important;
  font-size: ${TITLE_SIZE};
  font-weight: ${TITLE_WEIGHT};
  letter-spacing: ${TITLE_SPACING};
`

const LogoBackground = styled.div`
  background: url('${LOGO_BACKGROUND_IMAGE}');
  background-size: auto 100%;
  width: 500px;
  background-repeat: no-repeat;
  height: ${NAV_HEIGHT};
  position: fixed;

  ${mediaMaxWidth(PHONE)} {
    display: none;
  }
`

const LogoItem = styled.a<{ $isHub?: boolean }>`
  padding: 0;

  &:hover {
    background-color: transparent !important;
  }

  ${({ $isHub }) =>
    $isHub
      ? `
    ${mediaMaxWidth(MD)} {
      margin-top: 1rem;
    }
  `
      : ''}
`

type HeaderProps = {
  authenticated: boolean | null
  userInfo?: UserInfo
}

function withFading<T>(
  Element: React.ComponentType<T>,
  invert: boolean,
  max: number,
): React.ComponentType<T> {
  return (props: any): ReactElement<any> => {
    const [opacity, setOpacity] = useState<number>(invert ? 1 : 0)

    useEffect(() => {
      const handleScroll = () => {
        setOpacity(Math.min(Math.max(0, (150 - window.scrollY) / 150), 1))
      }

      window.addEventListener('scroll', handleScroll)

      return () => window.removeEventListener('scroll', handleScroll)
    })

    return (
      <Element
        style={{ opacity: (invert ? 1 - opacity : opacity) * max }}
        {...props}
      />
    )
  }
}

const FadingLogoBackground = withFading(LogoBackground, true, 0.6)
const isHub = SITE_ID === 'fyh'

const Header = ({
  authenticated,
  userInfo,
}: HeaderProps): ReactElement<any> => {
  const [show, setShow] = useState(false)
  const router = useRouter()

  const toggle = () => setShow(!show)

  return (
    <>
      <Heading />
      <NavSpacer />
      <Nav
        className={`navbar ${isHub ? 'is-dark' : ''}`}
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          {LOGO_BACKGROUND_IMAGE != null && <FadingLogoBackground />}
          <Link href={HOME_ROUTE} passHref legacyBehavior>
            <LogoItem className="navbar-item" $isHub={isHub}>
              <Logo src={SITE_LOGO} alt={`${SITE_NAME} Logo`} />
              <Title>{SITE_NAME}</Title>
            </LogoItem>
          </Link>
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            {authenticated === false && (
              <MobileLoginButton
                className="button"
                href={`${LOGIN_URL}?next=${router.asPath}`}
                onClick={() => logEvent('login', 'click')}
              >
                Login
              </MobileLoginButton>
            )}
            <Burger toggle={toggle} />
          </div>
        </div>
        <Links userInfo={userInfo} authenticated={authenticated} show={show} />
      </Nav>
      {isHub && <ImageHead />}
      {SHOW_FEEDBACK && <Feedback />}
    </>
  )
}

export default Header
