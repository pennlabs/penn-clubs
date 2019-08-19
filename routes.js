const nextRoutes = require('next-routes')
const routes = (module.exports = nextRoutes())

routes.add('club', '/club/:club')
