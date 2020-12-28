import ReactGA from 'react-ga'

import { GA_TRACKING_CODE } from './branding'

const dev = process.env.NODE_ENV !== 'production'

export const initGA = (): void => {
  if (!dev) {
    ReactGA.initialize(GA_TRACKING_CODE)
  } else {
    console.log('GA init') // eslint-disable-line
  }
}

export const logPageView = (): void => {
  if (!dev) {
    ReactGA.set({ page: window.location.pathname })
    ReactGA.pageview(window.location.pathname)
  } else {
    console.log(`Logging pageview for ${window.location.pathname}`) // eslint-disable-line
  }
}

export const logEvent = (category = '', action = ''): void => {
  if (!dev) {
    if (category && action) {
      ReactGA.event({ category, action })
    }
  } else {
    console.log(category, action) // eslint-disable-line
  }
}

export const logException = (description = '', fatal = false): void => {
  if (!dev) {
    if (description) {
      ReactGA.exception({ description, fatal })
    }
  } else {
    console.error(description, fatal) // eslint-disable-line
  }
}
