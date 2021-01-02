module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  async rewrites() {
    return [
      {
        source: '/sacfairguide',
        destination: '/guides/fair',
      },
      {
        source: '/org/:slug*',
        destination: '/club/:slug*',
      },
    ]
  },
  publicRuntimeConfig: {
    SITE_ORIGIN: process.env.DOMAIN
      ? `https://${process.env.DOMAIN}`
      : `http://localhost:${process.env.PORT || 3000}`,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME || 'clubs',
  },
  productionBrowserSourceMaps: true,
}
