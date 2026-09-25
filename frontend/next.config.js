module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  compiler: {
    styledComponents: true,
  },
  async rewrites() {
    const rewrites = [
      {
        source: '/sacfairguide',
        destination: '/guides/fair',
      },
      {
        source: '/org/:slug*',
        destination: '/club/:slug*',
      },
    ]
    if (process.env.NODE_ENV !== 'production') {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
      rewrites.push(
        {
          source: '/api/:path((?!api/.*$).*)',
          destination: `${backendUrl}/api/:path/`,
        },
        {
          source: '/api/:path((?!api/).*)/:query(.*)',
          destination: `${backendUrl}/api/:path/:query`,
        },
      )
    }
    return rewrites
  },
  async redirects() {
    return [
      { source: '/reports', destination: '/admin/reports', permanent: true },
      { source: '/rank', destination: '/faq', permanent: true },
    ]
  },
  publicRuntimeConfig: {
    // If DOMAIN starts with http, use it directly, otherwise add https
    SITE_ORIGIN: process.env.DOMAIN
      ? process.env.DOMAIN.startsWith('http')
        ? process.env.DOMAIN
        : `https://${process.env.DOMAIN}`
      : `http://localhost:${process.env.PORT || 3000}`,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'clubs',
    SENTRY_URL: process.env.SENTRY_URL,
  },
  productionBrowserSourceMaps: true,
  trailingSlash: true,
}
