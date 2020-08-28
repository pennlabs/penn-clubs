export const HOME_ROUTE = '/'
// Links require both the route with route parameters and the route itself Ex: /club/penn-labs and /club/[club]
export const CLUB_ROUTE = (slug?: string): string =>
  slug ? `/club/${slug}` : '/club/[club]'
export const CLUB_EDIT_ROUTE = (slug?: string): string =>
  slug ? `/club/${slug}/edit` : '/club/[club]/edit'
export const CLUB_FLYER_ROUTE = (slug?: string): string =>
  slug ? `/club/${slug}/flyer` : '/club/[club]/flyer'
export const CLUB_RENEW_ROUTE = (slug?: string): string =>
  slug ? `/club/${slug}/renew` : '/club/[club]/renew'
export const SETTINGS_ROUTE = '/settings'
export const USER_RENEWAL = '/renew'
export const CREATE_ROUTE = '/create'
export const DIRECTORY_ROUTE = '/directory'
export const LIVE_EVENTS = '/events'
export const FAIR_INFO_ROUTE = '/fair'
