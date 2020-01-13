import ReactGA from 'react-ga'

export const initGA = () => {
  console.log('GA init') // eslint-disable-line
  ReactGA.initialize('UA-21029575-14')
}
export const logPageView = () => {
  console.log(`Logging pageview for ${window.location.pathname}`) // eslint-disable-line
  ReactGA.set({ page: window.location.pathname })
  ReactGA.pageview(window.location.pathname)
}
export const logEvent = (category = '', action = '') => {
  if (category && action) {
    ReactGA.event({ category, action })
  }
}
export const logException = (description = '', fatal = false) => {
  if (description) {
    ReactGA.exception({ description, fatal })
  }
}
