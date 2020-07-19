import fetch from 'isomorphic-unfetch'
import { ReactElement } from 'react'

import { MembershipRank } from './types'

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
    ? `https://${process.env.DOMAIN || 'pennclubs.com'}`
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

export function titleize(str: string): string {
  if (!str) return str
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map((a) => a[0].toUpperCase() + a.substr(1).toLowerCase())
    .join(' ')
}

export function formatResponse(err: { [key: string]: string }): ReactElement {
  return (
    <>
      {Object.keys(err).map((line) => (
        <div key={line}>
          <b>{titleize(line)}:</b> {err[line]}
        </div>
      ))}
    </>
  )
}
