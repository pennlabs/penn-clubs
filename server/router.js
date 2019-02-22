module.exports = function(app, platformAuth, handle) {

  app.get('/login', (req, res) => {
    console.log("HERE");
    const uri = platformAuth.code.getUri()
    res.redirect(uri)
  })

  app.get('/auth', (req, res) => {
    console.log("auth!", req.originalUrl)
    platformAuth.code.getToken(req.originalUrl, platformAuth)
      .then((user) => {
        console.log("user", user) //=> { accessToken: '...', tokenType: 'bearer', ... }

        // // Refresh the current users access token.
        // user.refresh().then((updatedUser) => {
        //   console.log(updatedUser !== user) //=> true
        //   console.log(updatedUser.accessToken)
        // })
        //
        // // Sign API requests on behalf of the current user.
        // user.sign({
        //   method: 'get',
        //   url: 'http://example.com',
        // })

        // We should store the token into a database.
        return res.send(user.accessToken)
      })
      .catch((err) => {
        console.log("err", err)
      })
  })

  app.get('*', (req,res) => {
    return handle(req,res) // for all the react stuff
  })
}
