import getConfig from 'next/config';


export function getDefaultClubImageURL() {
    return 'http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg'
}

export function doApiRequest(path, data) {
    if (!data) {
        data = {}
    }
    data['credentials'] = 'include'
    if (typeof document !== 'undefined') {
        data['headers'] = Object.assign({'Content-Type': 'application/json', 'X-CSRFToken': /csrftoken=(\w+)/.exec(document.cookie)[1]}, data['headers'] || {})
    }
    if (data.body) {
        data.body = JSON.stringify(data.body)
    }
    const base_url = getConfig().publicRuntimeConfig.API_BASE_URL || 'https://clubs.pennlabs.org'
    return fetch(base_url + path, data)
}
