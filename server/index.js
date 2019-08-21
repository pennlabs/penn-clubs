const express = require('express')
const next = require('next')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000
const dev = process.env.NODE_DEV !== 'production' //true false
const nextApp = next({ dev })
const handle = nextApp.getRequestHandler()
const path = require('path')


const ClientOAuth2 = require('client-oauth2')
const platformAuth = new ClientOAuth2({
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  accessTokenUri: 'https://platform.pennlabs.org/accounts/token/',
  authorizationUri: 'https://platform.pennlabs.org/accounts/authorize/',
  redirectUri: 'http://localhost:5000/auth',
  scopes: ['read', 'write'],
  state: "eva",
})

if (process.env.MAINTENANCE) {
  app = express()
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../static/maintenance.html'))
  })
  app.use('/static', express.static('static'))
  app.listen(PORT, () => console.log(`ready at http://localhost:${PORT} (maintenance mode)`))
}
else {
  nextApp.prepare().then(() => {
    // express code here
    const app = express()
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.listen(PORT, (err) => {
    if (err) throw err
    console.log(`ready at http://localhost:${PORT}`)
    require('./router.js')(app, platformAuth, handle)
  });
  })
}
