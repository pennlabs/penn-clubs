const ClientOAuth2 = require('client-oauth2')
const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const router = require('./router')

const PORT = process.env.PORT || 5000
const dev = process.env.NODE_DEV !== 'production'

const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()

const platformAuth = new ClientOAuth2({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  accessTokenUri: 'https://platform.pennlabs.org/accounts/token/',
  authorizationUri: 'https://platform.pennlabs.org/accounts/authorize/',
  redirectUri: 'http://localhost:5000/auth',
  scopes: ['read', 'write'],
  state: 'eva',
})

nextApp.prepare().then(() => {
  const app = express()

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.listen(PORT, (err) => {
    if (err) throw err
    console.log(`ready at http://localhost:${PORT}`)
    router(app, platformAuth, handle)
  })
})
