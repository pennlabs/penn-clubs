/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.DOMAIN
    ? process.env.DOMAIN.startsWith('http')
      ? process.env.DOMAIN
      : `https://${process.env.DOMAIN}`
    : 'https://pennclubs.com',
  generateRobotsTxt: true,
  // Exclude authenticated/admin pages and dynamic routes (provided by backend API)
  exclude: [
    '/admin/*',
    '/settings',
    '/zoom',
    '/apply/*',
    '/create',
    '/renew',
    '/invite/*',
    '/applications',
    '/user/*',
    '/wharton/*',
    '/health',
    '/club/*',
    '/events/*',
  ],
  // Fetch dynamic club and event URLs from backend
  additionalPaths: async (config) => {
    try {
      const apiUrl = process.env.DOMAIN
        ? process.env.DOMAIN.startsWith('http')
          ? process.env.DOMAIN
          : `https://${process.env.DOMAIN}`
        : 'https://pennclubs.com'
      const res = await fetch(`${apiUrl}/api/sitemap-paths/`)
      if (!res.ok) {
        return []
      }
      const paths = await res.json()
      return paths.map((path) => ({
        loc: path,
        lastmod: new Date().toISOString(),
      }))
    } catch {
      return []
    }
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/settings',
          '/zoom',
          '/apply/',
          '/create',
          '/renew',
          '/invite/',
        ],
      },
    ],
  },
}
