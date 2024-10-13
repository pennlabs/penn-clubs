import { SITE_ID } from '../utils/branding'

const MEASUREMENTS = {
  clubs: {
    NAV_HEIGHT: '3.25rem',
    LOGO_SCALE: '1',
    HEADER_SHADOW: 'default',
    TITLE_CLASS: '1.5rem',
    TITLE_MARGIN: '15px',
    TITLE_SPACING: '0rem',
    TITLE_WEIGHT: '700',
    LOGIN_MARGIN: 'default',
    LOGIN_OPACITY: '1.0',
    LINK_MARGIN: '14px',
    LINK_SPACING: '20px',
    CARD_HEADING: '700',
    BANNER_HEIGHT: '0rem',
    FULL_NAV_HEIGHT: '3.25rem',
  },
  fyh: {
    NAV_HEIGHT: '5.25rem',
    LOGO_SCALE: '1.7',
    HEADER_SHADOW: '2px 0px 5px black',
    TITLE_CLASS: '2.4rem',
    TITLE_MARGIN: '35px',
    TITLE_SPACING: '-0.1rem',
    TITLE_WEIGHT: '300',
    LOGIN_MARGIN: '0px',
    LOGIN_OPACITY: '0.8',
    LINK_MARGIN: '50px',
    LINK_SPACING: '60px',
    CARD_HEADING: '400',
    BANNER_HEIGHT: '7.5rem',
    FULL_NAV_HEIGHT: '12.75rem',
  },
}

export const NAV_HEIGHT = MEASUREMENTS[SITE_ID].NAV_HEIGHT
export const LOGO_SCALE = MEASUREMENTS[SITE_ID].LOGO_SCALE
export const HEADER_SHADOW = MEASUREMENTS[SITE_ID].HEADER_SHADOW
export const TITLE_SIZE = MEASUREMENTS[SITE_ID].TITLE_CLASS
export const TITLE_MARGIN = MEASUREMENTS[SITE_ID].TITLE_MARGIN
export const TITLE_SPACING = MEASUREMENTS[SITE_ID].TITLE_SPACING
export const TITLE_WEIGHT = MEASUREMENTS[SITE_ID].TITLE_WEIGHT
export const LOGIN_MARGIN = MEASUREMENTS[SITE_ID].LOGIN_MARGIN
export const LOGIN_OPACITY = MEASUREMENTS[SITE_ID].LOGIN_OPACITY
export const LINK_MARGIN = MEASUREMENTS[SITE_ID].LINK_MARGIN
export const LINK_SPACING = MEASUREMENTS[SITE_ID].LINK_SPACING
export const CARD_HEADING = MEASUREMENTS[SITE_ID].CARD_HEADING
export const BANNER_HEIGHT = MEASUREMENTS[SITE_ID].BANNER_HEIGHT
export const FULL_NAV_HEIGHT = MEASUREMENTS[SITE_ID].FULL_NAV_HEIGHT

export const BORDER_RADIUS = '4px'
export const BORDER_RADIUS_LG = '8px'

export const mediaMinWidth = (width: string): string =>
  `@media screen and (min-width: ${width})`
export const mediaMaxWidth = (width: string): string =>
  `@media screen and (max-width: ${width})`
export const getNumberFromPx = (px: string): number =>
  parseInt(px.replace('px', ''), 10)

export const SM = '768px'
export const MD = '992px'
export const LG = '1200px'
export const XL = '1440px'

export const DESKTOP = '1248px'
export const TABLET = '992px'
export const PHONE = '584px'

export const SEARCH_BAR_MOBILE_HEIGHT = '60px'

export const ANIMATION_DURATION = '200ms'
export const LONG_ANIMATION_DURATION = '400ms'

export const M0 = '0'
export const M1 = '0.4rem'
export const M2 = '0.8rem'
export const M3 = '1.2rem'
export const M4 = '1.6rem'

export const L1 = '2.9rem'
export const L2 = '0.6rem'

export const SIXTEEN_BY_NINE = '56.25%'
