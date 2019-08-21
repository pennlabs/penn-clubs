const nextRoutes = require('next-routes')
const routes = (module.exports = nextRoutes())

routes.add('club-view', '/club/:club', 'club')
routes.add('club-edit', '/club/:club/edit', 'edit')
routes.add('club-create', '/create', 'edit')
routes.add('settings', '/settings', 'settings')
routes.add('invite', '/invite/:club/:invite/:token', 'invite')
