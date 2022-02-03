import { OBJECT_URL_SLUG } from '../utils/branding'

export const HOME_ROUTE = '/'
// Links require both the route with route parameters and the route itself Ex: /club/penn-labs and /club/[club]
export const CLUB_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}` : `/${OBJECT_URL_SLUG}/[club]`
export const CLUB_EDIT_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}/edit` : `/${OBJECT_URL_SLUG}/[club]/edit`
export const CLUB_SETTINGS_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/edit/settings`
    : `/${OBJECT_URL_SLUG}/[club]/edit/settings`
export const CLUB_FLYER_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/flyer`
    : `/${OBJECT_URL_SLUG}/[club]/flyer`
export const CLUB_RENEW_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/renew`
    : `/${OBJECT_URL_SLUG}/[club]/renew`
export const CLUB_APPLY_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/apply`
    : `/${OBJECT_URL_SLUG}/[club]/apply`
export const CLUB_ORG_ROUTE = (slug?: string): string =>
  slug ? `/${OBJECT_URL_SLUG}/${slug}/org` : `/${OBJECT_URL_SLUG}/[club]/org`
export const CLUB_ALUMNI_ROUTE = (slug?: string): string =>
  slug
    ? `/${OBJECT_URL_SLUG}/${slug}/alumni`
    : `/${OBJECT_URL_SLUG}/[club]/alumni`
export const SETTINGS_ROUTE = '/settings'
export const USER_RENEWAL = '/renew'
export const CREATE_ROUTE = '/create'
export const DIRECTORY_ROUTE = '/directory'
export const LIVE_EVENTS = '/events'
export const FAIR_INFO_ROUTE = '/fair'
export const ADMIN_ROUTE = '/admin'
export const APPLY_ROUTE = '/apply'
export const WHARTON_ROUTE = '/wharton'
export const FAIR_OFFICER_GUIDE_ROUTE = '/sacfairguide'
export const GUIDE_ROUTE = (slug?: string): string =>
  slug ? `/guides/${slug}` : '/guides/[page]'

export const REPORT_LIST_ROUTE = '/admin/reports'
export const REPORT_CREATE_ROUTE = '/admin/reports/create'
export const REPORT_EDIT_ROUTE = (slug?: number): string =>
  slug ? `/admin/reports/${slug}` : '/admin/reports/[report]'

export const PROFILE_ROUTE = (slug?: string): string =>
  slug ? `/user/${slug}` : '/user/[user]'

export const CLUBS_HOME = 'https://pennclubs.com/'
export const HUB_HOME = 'https://hub.provost.upenn.edu/'
