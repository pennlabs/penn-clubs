import getConfig from 'next/config';


export function getDefaultClubImageURL() {
    return 'http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg'
}

export const API_BASE_URL = getConfig().publicRuntimeConfig.API_BASE_URL || 'https://api.pennclubs.com'

export function doApiRequest(path, data) {
    if (!data) {
        data = {}
    }
    data['credentials'] = 'include'
    if (typeof document !== 'undefined') {
        data['headers'] = Object.assign({'Content-Type': 'application/json', 'X-CSRFToken': (/csrftoken=(\w+)/.exec(document.cookie) || [null, null])[1]}, data['headers'] || {})
    }
    if (data.body) {
        data.body = JSON.stringify(data.body)
    }
    return fetch(API_BASE_URL + path, data)
}
