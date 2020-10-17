import { SITE_ID } from '../utils/branding'

export const BASE =
  '"HelveticaNeue", "Helvetica Neue", BlinkMacSystemFont, -apple-system, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", Helvetica, Arial, sans-serif'

const BODY = {
  clubs: {
    BODY_FONT: `Inter, "Inter", ${BASE}`,
  },
  fyh: {
    BODY_FONT: `OpenSans, "OpenSans", ${BASE}`,
  },
}

export const BODY_FONT = BODY[SITE_ID].BODY_FONT
