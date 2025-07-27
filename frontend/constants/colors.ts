import { SITE_ID } from '../utils/branding'

/**
 * Constant Colors
 */

export const WHITE = '#fff'
export const WHITE_ALPHA = (alpha: number): string =>
  `rgba(255, 255, 255, ${alpha})`
export const SHADOW = 'rgba(0, 0, 0, 0.07)'
export const SNOW_ALPHA = 'rgba(244, 246, 249, 0.75)'
export const ALLBIRDS_GRAY = '#EAEAEA'
export const BLACK = '#000'
export const BLACK_ALPHA = (alpha: number): string => `rgba(0, 0, 0, ${alpha})`
export const DARK_GRAY = '#4A4A4A'
export const MEDIUM_GRAY = '#737373'
export const LIGHT_GRAY = '#979797'
export const FOCUS_GRAY = '#F0F0F0'
export const BACKGROUND_GRAY = '#F4F4F4'
export const HOVER_GRAY = '#F8F8F8'
export const BORDER = 'rgba(0, 0, 0, 0.1)'

export const BABY_BLUE = '#eff7ff'
export const LIGHTER_BLUE = '#d9eafc'
export const LIGHT_BLUE = '#84add5'
export const BLUE = '#2980B9'
export const DARK_BLUE = '#246793'

export const LIGHT_GREEN = '#e8f9ec'
export const GREEN = '#3eaa6d'
export const FOREST = '#3a7553'
export const RED = '#e25152'
export const PINK = '#F67C83'
export const LIGHT_YELLOW = '#fff5dd'
export const YELLOW = '#ffc520'
export const MUSTARD = '#efb717'
export const ORANGE = '#faa432'
export const PURPLE = '#834fa0'

export const LIGHT_RED = '#f7dcdc'
export const LIGHTER_RED = '#f7e6e6'

export const CLUBS_PURPLE = '#834fa0'
export const CLUBS_GREY = '#414654'
export const CLUBS_GREY_LIGHT = '#4f4f4f'
export const CLUBS_NAVY = '#1f2049'
export const CLUBS_RED = '#ef4c5f'
export const CLUBS_RED_DARK = '#e03a4e'
export const CLUBS_YELLOW = '#FFCF59'
export const CLUBS_BLUE = '#4954f4'
export const CLUBS_LIGHT_BLUE = '#e1e3ff'
export const CLUBS_DEEP_BLUE = '#2c37d1'

export const HUB_NAVY = '#000f3a'
export const HUB_NAVY_LIGHT = '#616a84'
export const HUB_RED = '#95001a'
export const HUB_WHITE = '#ffffff'
export const HUB_SNOW = '#f2f2f3'
export const HUB_LIGHT_BLUE = '#82afd3'
export const HUB_YELLOW = '#f2c100'
export const EVENT_TYPE_COLORS = [
  '#E5E5E5',
  '#FFF5DD',
  '#FDE4E7',
  '#E1E3FF',
  '#EDE2FE',
]

export const ZOOM_BLUE = '#2D8CFF'

export const PROPIC_BACKGROUND = [
  '#D0F0FD',
  '#C2F5E9',
  '#D1F7C4',
  '#FFEAB6',
  '#FFDDE5',
  '#EDE2FE',
]
export const PROPIC_TEXT = [
  '#03293F',
  '#022524',
  '#0B1F06',
  '#503914',
  '#541625',
  '#280A42',
]

/**
 * Branding Switch Colors
 */

const COLOR_SCHEME = {
  clubs: {
    ADD_BUTTON: CLUBS_BLUE,
    BANNER_BG: WHITE,
    BANNER_TEXT: CLUBS_NAVY,
    BG_GRADIENT: 'linear-gradient(to right, #4954f4, #44469a)',
    FEEDBACK_BG: CLUBS_BLUE,
    H1_TEXT: CLUBS_GREY,
    LOGIN_BACKGROUND: CLUBS_RED,
    PRIMARY_TAG_BG: CLUBS_LIGHT_BLUE,
    PRIMARY_TAG_TEXT: CLUBS_BLUE,
    SNOW: '#fafcff',

    PROGRESS_INDICATOR_TEXT: BLACK,
    PROGRESS_INDICATOR_PRIMARY: LIGHT_GREEN,
    PROGRESS_INDICATOR_SECONDARY: LIGHT_YELLOW,
    PROGRESS_INDICATOR_SEP: MEDIUM_GRAY,
  },
  fyh: {
    ADD_BUTTON: HUB_RED,
    BANNER_BG: HUB_NAVY,
    BANNER_TEXT: HUB_WHITE,
    BG_GRADIENT: 'linear-gradient(to right, #004785, #a90533)',
    FEEDBACK_BG: HUB_NAVY,
    H1_TEXT: HUB_NAVY,
    LOGIN_BACKGROUND: HUB_NAVY,
    PRIMARY_TAG_BG: HUB_RED,
    PRIMARY_TAG_TEXT: HUB_WHITE,
    SNOW: '#f2f2f3',

    PROGRESS_INDICATOR_TEXT: WHITE,
    PROGRESS_INDICATOR_PRIMARY: HUB_NAVY,
    PROGRESS_INDICATOR_SECONDARY: HUB_NAVY_LIGHT,
    PROGRESS_INDICATOR_SEP: HUB_NAVY_LIGHT,
  },
}

export const ADD_BUTTON = COLOR_SCHEME[SITE_ID].ADD_BUTTON
export const BANNER_BG = COLOR_SCHEME[SITE_ID].BANNER_BG
export const BANNER_TEXT = COLOR_SCHEME[SITE_ID].BANNER_TEXT
export const BG_GRADIENT = COLOR_SCHEME[SITE_ID].BG_GRADIENT
export const FEEDBACK_BG = COLOR_SCHEME[SITE_ID].FEEDBACK_BG
export const H1_TEXT = COLOR_SCHEME[SITE_ID].H1_TEXT
export const LOGIN_BACKGROUND = COLOR_SCHEME[SITE_ID].LOGIN_BACKGROUND
export const PRIMARY_TAG_BG = COLOR_SCHEME[SITE_ID].PRIMARY_TAG_BG
export const PRIMARY_TAG_TEXT = COLOR_SCHEME[SITE_ID].PRIMARY_TAG_TEXT
export const SNOW = COLOR_SCHEME[SITE_ID].SNOW

export const PROGRESS_INDICATOR_TEXT =
  COLOR_SCHEME[SITE_ID].PROGRESS_INDICATOR_TEXT
export const PROGRESS_INDICATOR_PRIMARY =
  COLOR_SCHEME[SITE_ID].PROGRESS_INDICATOR_PRIMARY
export const PROGRESS_INDICATOR_SECONDARY =
  COLOR_SCHEME[SITE_ID].PROGRESS_INDICATOR_SECONDARY
export const PROGRESS_INDICATOR_SEP =
  COLOR_SCHEME[SITE_ID].PROGRESS_INDICATOR_SEP

/**
 * Bulma Colors and Overrides
 */
export const BULMA_PRIMARY =
  SITE_ID === 'fyh' ? '#95001a' : 'hsl(171, 100%, 41%)'
export const BULMA_LINK = SITE_ID === 'fyh' ? '#82afd3' : 'hsl(217, 71%, 53%)'
export const BULMA_INFO = SITE_ID === 'fyh' ? '#01256e' : 'hsl(204, 86%, 53%)'
export const BULMA_SUCCESS =
  SITE_ID === 'fyh' ? '#00b050' : 'hsl(141, 53%, 53%)'
export const BULMA_WARNING =
  SITE_ID === 'fyh' ? '#f2c100' : 'hsl(48, 100%, 67%)'
export const BULMA_DANGER =
  SITE_ID === 'fyh' ? '#ff0000' : 'hsl(348, 100%, 61%)'
export const BULMA_A = SITE_ID === 'fyh' ? '#256ADA' : '#3273dc'
export const BULMA_GREY = SITE_ID === 'fyh' ? '#6E6E6E' : 'hsl(0, 0%, 48%)'

/**
 * Select Tag Colors
 */

export const TAG_TEXT_COLOR_MAP = {
  tags__in: PRIMARY_TAG_TEXT,
}

export const TAG_BACKGROUND_COLOR_MAP = {
  tags__in: PRIMARY_TAG_BG,
  size__in: CLUBS_NAVY,
  application_required__in: CLUBS_RED,
  affiliations__in: CLUBS_PURPLE,
  recruiting_cycle__in: CLUBS_RED_DARK,
}
