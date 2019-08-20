import getConfig from 'next/config'

export function getDefaultClubImageURL() {
  return 'http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg'
}

function removeEndingSlash(val) {
  if (typeof val !== 'string') {
    return val
  }
  if (val.endsWith('/')) {
    return val.substring(0, val.length - 1)
  }
  return val
}

export const API_BASE_URL = removeEndingSlash(getConfig().publicRuntimeConfig.API_BASE_URL) || 'https://api.pennclubs.com'
export const ROLE_OWNER = 0
export const ROLE_OFFICER = 10
export const ROLE_MEMBER = 20

export const EMPTY_DESCRIPTION = '<span style="color:#666">This club has not added a description yet.</span>'

export function getSizeDisplay(size) {
  if (size === 1) return '0 - 20 Members'
  else if (size === 2) return '20 - 50 Members'
  else if (size === 3) return '50 - 100 Members'
  else if (size === 0) return '100+ Members'
  else return 'Unknown'
}

export function getRoleDisplay(role) {
  if (role <= 0) return 'Owner'
  else if (role <= 10) return 'Officer'
  else return 'Member'
}

export function doApiRequest(path, data) {
  if (!data) {
    data = {}
  }
  data.credentials = 'include'
  if (typeof document !== 'undefined') {
    data.headers = Object.assign({ 'Content-Type': 'application/json', 'X-CSRFToken': (/csrftoken=(\w+)/.exec(document.cookie) || [null, null])[1] }, data.headers || {})
  }
  if (data.body) {
    data.body = JSON.stringify(data.body)
  }
  return fetch(API_BASE_URL + path, data)
}

export function titleize(str) {
  if (!str) return str
  return str.replace(/_/g, ' ').split(' ').map((a) => a[0].toUpperCase() + a.substr(1).toLowerCase()).join(' ')
}
