import { SITE_ID } from '../utils/branding'

const COLOR_SCHEME = {
  clubs: {
    BANNER_BG: '#ffffff',
    BANNER_TEXT: '#1f2049',
    LOGIN_BACKGROUND: '#ef4c5f',
    H1_TEXT: '#414654',
    ADD_BUTTON: '#4954f4',
    PRIMARY_TAG_BG: '#e1e3ff',
    PRIMARY_TAG_TEXT: '#4954f4',
    FEEDBACK_BG: '#4954f4',
    SNOW: '#fafcff',
    BG_GRADIENT: 'linear-gradient(to right, #4954f4, #44469a)',
  },
  fyh: {
    BANNER_BG: '#000f3a',
    BANNER_TEXT: '#ffffff',
    LOGIN_BACKGROUND: '#000f3a',
    H1_TEXT: '#000f3a',
    ADD_BUTTON: '#95001a',
    PRIMARY_TAG_BG: '#95001a',
    PRIMARY_TAG_TEXT: '#ffffff',
    FEEDBACK_BG: '#000f3a',
    SNOW: '#f2f2f3',
    BG_GRADIENT: 'linear-gradient(to right, #004785, #a90533)',
  },
}

export const BANNER_BG = COLOR_SCHEME[SITE_ID].BANNER_BG
export const BG_GRADIENT = COLOR_SCHEME[SITE_ID].BG_GRADIENT
export const BANNER_TEXT = COLOR_SCHEME[SITE_ID].BANNER_TEXT
export const LOGIN_BACKGROUND = COLOR_SCHEME[SITE_ID].LOGIN_BACKGROUND
export const H1_TEXT = COLOR_SCHEME[SITE_ID].H1_TEXT
export const ADD_BUTTON = COLOR_SCHEME[SITE_ID].ADD_BUTTON
export const PRIMARY_TAG_BG = COLOR_SCHEME[SITE_ID].PRIMARY_TAG_BG
export const PRIMARY_TAG_TEXT = COLOR_SCHEME[SITE_ID].PRIMARY_TAG_TEXT
export const FEEDBACK_BG = COLOR_SCHEME[SITE_ID].FEEDBACK_BG
export const SNOW = COLOR_SCHEME[SITE_ID].SNOW

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
export const CLUBS_GREY_LIGHT = '#979797'
export const CLUBS_NAVY = '#1f2049'
export const CLUBS_RED = '#ef4c5f'
export const CLUBS_RED_DARK = '#e03a4e'
export const CLUBS_YELLOW = '#FFCF59'
export const CLUBS_BLUE = '#4954f4'
export const CLUBS_LIGHT_BLUE = '#e1e3ff'
export const CLUBS_DEEP_BLUE = '#2c37d1'

export const HUB_NAVY = '#000f3a'
export const HUB_RED = '#95001a'
export const HUB_WHITE = '#ffffff'
export const HUB_SNOW = '#f2f2f3'
export const HUB_LIGHT_BLUE = '#82afd3'
export const HUB_YELLOW = '#f2c100'

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

export const TAG_TEXT_COLOR_MAP = {
  tags__in: PRIMARY_TAG_TEXT,
}

export const TAG_BACKGROUND_COLOR_MAP = {
  tags__in: PRIMARY_TAG_BG,
  size__in: CLUBS_NAVY,
  application_required__in: CLUBS_RED,
  badges__in: CLUBS_PURPLE,
}
