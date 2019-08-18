import getConfig from 'next/config';


export function getDefaultClubImageURL() {
    return 'http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg';
}

export function getApiBaseURL() {
    return getConfig().publicRuntimeConfig.API_BASE_URL || 'https://clubs.pennlabs.org';
}
