const PORT = process.env.PORT || 3000
const dev = process.env.NODE_DEV !== 'production' //true false
const path = require('path')
const { createServer } = require('http')
const next = require('next')
const routes = require('../routes')
const nextApp = next({ dev })
const handler = routes.getRequestHandler(nextApp)


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
    createServer(handler).listen(PORT, (err) => {
      if (err) throw err
      console.log(`ready at http://localhost:${PORT}`)
    })
  })
}
