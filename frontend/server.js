/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const fastify = require('fastify')
const next = require('next')

/**
 * @type {import('@fastify/http-proxy').FastifyHttpProxyOptions[]}
 */
const devProxy = [
  {
    upstream: 'http://127.0.0.1:8000',
    prefix: '/api',
    rewritePrefix: '/api',
  },
  {
    upstream: 'http://127.0.0.1:8000',
    prefix: '/__debug__',
    rewritePrefix: '/__debug__',
  },
]

const port = parseInt(process.env.PORT, 10) || 3000
const env = process.env.NODE_ENV
const dev = env !== 'production'
const app = next({
  dir: '.', // base directory where everything is, could move to src later
  dev,
})

const main = async () => {
  await app.prepare()
  const handle = app.getRequestHandler()
  const server = fastify({ logger: dev })
  if (dev && devProxy) {
    const proxy = require('@fastify/http-proxy')
    devProxy.forEach((options) => {
      server.register(proxy, options)
    })
  }
  server.all('*', (req, res) => {
    try {
      return handle(req.raw, res.raw)
    } catch (error) {
      console.log(error)
      return app.renderError(error, req.raw, res.raw, req.url, {})
    } finally {
      res.sent = true
    }
  })
  try {
    await server.listen({
      port,
    })
    console.log(`> Ready on port ${port} [${env || 'development'}]`)
  } catch (error) {
    console.log('-> An error occurred, unable to start the server')
    throw error
  }
}

main()
