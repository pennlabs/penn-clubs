/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const express = require('express')
const next = require('next')

const devProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    ws: true,
  },
  '/__debug__': {
    // this allows django debug toolbar to work properly
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}

const port = parseInt(process.env.PORT, 10) || 3000
const env = process.env.NODE_ENV
const dev = env !== 'production'
const app = next({
  dir: '.', // base directory where everything is, could move to src later
  dev,
})

const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const server = express()

    // Set up the development proxy to the backend
    if (dev && devProxy) {
      const { createProxyMiddleware } = require('http-proxy-middleware')
      Object.keys(devProxy).forEach(function (context) {
        const proxy = createProxyMiddleware(context, devProxy[context])
        server.use(context, proxy)
        console.log(`-> Using proxy middleware for route ${context}`)
      })
    }

    // Default catch-all handler to allow Next.js to handle all other routes
    server.all('*', (req, res) => handle(req, res))

    server.listen(port, (err) => {
      if (err) {
        throw err
      }
      console.log(`-> Ready on port ${port} [${env || 'development'}]`)
    })
  })
  .catch((err) => {
    console.log('-> An error occurred, unable to start the server')
    throw err
  })
