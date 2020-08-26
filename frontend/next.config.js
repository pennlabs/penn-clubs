module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })
    return config
  },
  async redirects() {
    return [
      {
        source: '/sacfairguide',
        destination: '/guides/sacfair',
        permanent: true,
      },
    ]
  },
}
