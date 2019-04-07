const Header = () => (
  <div>
    <head>
      <title>Penn Clubs</title>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bulma/0.7.4/css/bulma.min.css"/>
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossOrigin="anonymous" />
      <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossOrigin="anonymous" />
      <script src="https://unpkg.com/ionicons@4.5.5/dist/ionicons.js" />
    </head>

    <nav className="navbar is-fixed-top" role="navigation" aria-label="main navigation" style={{height: 50, borderBottom: "1px solid #e3e3e3"}}>
      <div className="navbar-brand">
        <a className="navbar-item" href="/">
          <img src="/static/img/pc.png" height="28" style={{paddingLeft: 15}}/>
        </a>

        <a role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div className="navbar-menu">
        <div className="navbar-end" style={{padding: "0px 30px"}}>
          <a href="/faq" className="" style={{padding: 15, textDecoration: "underline", color: "grey"}}>
            FAQ
          </a>
          <a href="/favorites" className="" style={{padding: 15, color: "grey"}}>
            <span className="icon">
              <i className="fas fa-heart"></i>
            </span>
          </a>
        </div>
      </div>
    </nav>
  </div>


);

export default Header
