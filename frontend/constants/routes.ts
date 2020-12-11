import { OBJECT_URL_SLUG } from '../utils/branding'

export const HOME_ROUTE = '/'
// Links require both the route with route parameters and the route itself Ex: /club/penn-labs and /club/[club]
export const CLUB_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}` : `/${OBJECT_URL_SLUG}/[club]`
export const CLUB_EDIT_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}/edit` : `/${OBJECT_URL_SLUG}/[club]/edit`
export const CLUB_FLYER_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/flyer`
    : `/${OBJECT_URL_SLUG}/[club]/flyer`
export const CLUB_RENEW_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/renew`
    : `/${OBJECT_URL_SLUG}/[club]/renew`
export const CLUB_ORG_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}/org` : `/${OBJECT_URL_SLUG}/[club]/org`
export const SETTINGS_ROUTE = '/settings'
export const USER_RENEWAL = '/renew'
export const CREATE_ROUTE = '/create'
export const DIRECTORY_ROUTE = '/directory'
export const LIVE_EVENTS = '/events'
export const FAIR_INFO_ROUTE = '/fair'
export const FAIR_OFFICER_GUIDE_ROUTE = '/sacfairguide'
export const GUIDE_ROUTE = (slug?: string): string =>
  slug ? `/guides/${slug}` : '/guides/[page]'

export const REPORT_LIST_ROUTE = '/reports'
export const REPORT_CREATE_ROUTE = '/reports/create'
export const REPORT_EDIT_ROUTE = (slug?: number): string =>
  slug ? `/reports/${slug}` : '/reports/[report]'
