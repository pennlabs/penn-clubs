import fetch from 'isomorphic-unfetch'
import React, { createContext, ReactElement, useContext } from 'react'

import { MembershipRank } from './types'
import { ALL_CLUB_FIELDS, CLUB_FIELDS, DOMAIN } from './utils/branding'

export function stripTags(val: string): string {
  if (!val) {
    return val
  }
  return val
    .replace(/(<[^>]+>)/gi, '')
    .replace('&amp;', '&')
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&ndash;', '-')
    .replace('&mdash;', '-')
    .replace('&nbsp;', ' ')
    .trim()
}

export const OptionsContext = createContext({})

/**
 * A react hook that returns the value of a Django runtime option setting.
 * If the setting is still loading, returns null.
 * @param key The setting to retrieve.
 */
export function useSetting(key: string): string | number | boolean | null {
  const options = useContext(OptionsContext)
  const value = options[key] ?? null
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return value
}

export function getCurrentRelativePath(): string {
  return (
    window.location.pathname + window.location.search + window.location.hash
  )
}

export function getDefaultClubImageURL(): string {
  return '/static/img/hatlogo.png'
}

export const SITE_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? `https://${process.env.DOMAIN || DOMAIN}`
    : `http://localhost:${process.env.PORT || 3000}`
export const API_BASE_URL = `${SITE_ORIGIN}/api`

export const EMPTY_DESCRIPTION =
  '<span style="color:#666">This club has not added a description yet.</span>'
export const LOGIN_URL = `${API_BASE_URL}/accounts/login/`
export const LOGOUT_URL = `${API_BASE_URL}/accounts/logout/`

export function getSizeDisplay(size: number, showMembersLabel = true): string {
  const postfix = showMembersLabel ? ' Members' : ''
  if (size === 1) return '< 20' + postfix
  else if (size === 2) return '20 - 50' + postfix
  else if (size === 3) return '50 - 100' + postfix
  else if (size === 4) return '> 100' + postfix
  else return 'Unknown'
}

export function getRoleDisplay(role: MembershipRank): string {
  if (role <= 0) return 'Owner'
  else if (role <= 10) return 'Officer'
  else return 'Member'
}

export function getApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    const url = new URL(path)
    return url.pathname + url.search
  }
  return API_BASE_URL + path
}

export const PermissionsContext = React.createContext<{
  [key: string]: boolean | null
}>({})

/**
 * Prefetch some permissions for the current page.
 * Should be executed at the start of each page with permissions.
 */
export async function preloadPermissions(
  permissions: string[],
): Promise<{ [key: string]: boolean | null }> {
  const resp = await doApiRequest(
    `/settings/permissions/?perm=${encodeURIComponent(
      permissions.join(','),
    )}&format=json`,
  )
  if (!resp.ok) {
    return {}
  }
  return (await resp.json()).permissions
}

/**
 * Check if the user has a Django permission.
 * If you were checking for the "clubs.approve_club" permission, pass the
 * string "clubs.approve_club".
 *
 * If you are checking for a permission that is object based, separate the
 * object identiifer with a colon. For example, "permission:object_id".
 */
export function apiCheckPermission(
  permission: string,
  failSilently?: boolean,
): boolean | null {
  const perms = useContext(PermissionsContext)
  if (permission in perms) {
    return perms[permission]
  }

  if (failSilently) {
    return false
  }

  throw new Error(
    `The permission '${permission}' was not preloaded on this page. You should preload this permission for efficiency purposes. Loaded permissions: ${JSON.stringify(
      perms,
    )}`,
  )
}

/**
 * Perform an API request to the Django backend server.
 * @param path The path to the REST endpoint, excluding the /api/ component.
 * @param data Additional fetch data to be passed in the request.
 */
export function doApiRequest(path: string, data?: any): Promise<Response> {
  if (!data) {
    data = {}
  }
  data.credentials = 'include'
  if (typeof document !== 'undefined') {
    data.headers = data.headers || {}
    if (!(data.body instanceof FormData)) {
      data.headers['Content-Type'] = 'application/json'
    }
    data.headers['X-CSRFToken'] = (/csrftoken=(\w+)/.exec(document.cookie) || [
      null,
      null,
    ])[1]
  }
  if (data.body && !(data.body instanceof FormData)) {
    data.body = JSON.stringify(data.body)
  }
  return fetch(getApiUrl(path), data)
}

export function apiSetFavoriteStatus(
  club: string,
  favorited: boolean,
): Promise<void> {
  if (favorited) {
    return doApiRequest('/favorites/?format=json', {
      method: 'POST',
      body: { club: club },
    }).then(() => undefined)
  } else {
    return doApiRequest(`/favorites/${club}/?format=json`, {
      method: 'DELETE',
    }).then(() => undefined)
  }
}

export function apiSetSubscribeStatus(
  club: string,
  subscribed: boolean,
): Promise<void> {
  if (subscribed) {
    return doApiRequest('/subscriptions/?format=json', {
      method: 'POST',
      body: {
        club: club,
      },
    }).then(() => undefined)
  } else {
    return doApiRequest(`/subscriptions/${club}/?format=json`, {
      method: 'DELETE',
    }).then(() => undefined)
  }
}

/**
 * Convert underscores into spaces and capitalize the first letter of every word.
 */
export function titleize(str: string): string {
  if (!str) return str
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((a) => a[0].toUpperCase() + a.substr(1).toLowerCase())
    .join(' ')
}

/**
 * Given a dictionary that you want to display to the user, converts this
 * dictionary into a displayable list of key value pairs.
 */
export function formatResponse(
  err: { [key: string]: string } | string,
): ReactElement {
  if (typeof err === 'string') {
    return <>{err}</>
  }

  return (
    <>
      {Object.keys(err)
        .filter(
          (line) => !(line === 'success' && typeof err[line] === 'boolean'),
        )
        .filter((line) => !(typeof err[line] === 'number'))
        .map((line) => (
          <div key={line}>
            <b>{titleize(line)}:</b> {err[line]}
          </div>
        ))}
    </>
  )
}

/**
 * Indicates whether a field is shown on the edit page
 * and the club information page.
 *
 * Looks up information from current branding to see which
 * fields should be displayed.
 */
export function isClubFieldShown(name: string): boolean {
  if (ALL_CLUB_FIELDS.has(name) && !CLUB_FIELDS.has(name)) {
    return false
  }
  return true
}

/**
 * Attempt to format a phone number in US phone number format.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = ('' + phone).replace(/\D/g, '')
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    const intlCode = match[1] ? '+1 ' : ''
    return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
  }
  return phone
}
