export const HOME_ROUTE = '/'
export const SETTINGS_ROUTE = '/settings'
// Links require both the route with route parameters and the route itself Ex: /club/penn-labs and /club/[club]
export const CLUB_ROUTE = slug => slug ? `/club/${slug}` : '/club/[club]'
export const CLUB_EDIT_ROUTE = slug => slug ? `/club/${slug}/edit` : '/club/[club]/edit'
export const CLUB_FLYER_ROUTE = slug => slug ? `/club/${slug}/flyer` : '/club/[club]/flyer'
