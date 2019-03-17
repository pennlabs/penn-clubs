

const Header = () => (
  <div>
    <head>
      <title>Penn Clubs</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="static/style.css" />
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossOrigin="anonymous" />
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossOrigin="anonymous" />
      <script src="https://unpkg.com/ionicons@4.5.5/dist/ionicons.js" />
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossOrigin="anonymous" />
    </head>

    <div className="collapse bg-light" id="navbarHeader">
      <div className="container">
        <div className="row">
          <div className="col-sm-8 col-md-7 py-4">
            <h4 className="text-dark">
              Built by
              <strong><a href="https://pennlabs.org"> Penn Labs</a></strong>
            </h4>
            <a type="button" href="/login">Login </a>
            <p className="text-muted">Penn Clubs is a collabrative effort by the UA and Penn Labs to make information about student engagement at Penn accessible to everybody.</p>
          </div>
          <div className="col-sm-4 offset-md-1 py-4">
            <h4 className="text-dark">Want your group/event here?</h4>
            <ul className="list-unstyled">
              <li><a href="mailto:contact@pennlabs.org" className="text-dark">Email Us!</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div className="navbar navbar-light bg-light shadow-sm">
      <div className="container d-flex justify-content-between">
        <a href="/" className="navbar-brand d-flex align-items-center">
          <strong> 🏛 &nbsp;Penn Clubs</strong>
        </a>
        <button
          style={{ borderWidth: 0 }}
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarHeader"
          aria-controls="navbarHeader"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
      </div>
    </div>
  </div>
)

export default Header
