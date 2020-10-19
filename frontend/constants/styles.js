import { SITE_ID } from '../utils/branding'

export const BASE =
  '"HelveticaNeue", "Helvetica Neue", BlinkMacSystemFont, -apple-system, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", Helvetica, Arial, sans-serif'

const BODY = {
  clubs: {
    BODY_FONT: `'Inter', sans-serif`,
  },
  fyh: {
    BODY_FONT: `'Open Sans', sans-serif`,
  },
}

export const BODY_FONT = BODY[SITE_ID].BODY_FONT
