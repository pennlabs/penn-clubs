const Footer = () => (
  <footer className="footer" style={{ height: '8rem', backgroundColor: '#f2f2f2' }}>
    <div className="container">
      <div className="content has-text-centered">
        <p style={{ fontSize: '0.85rem' }}>
            Made with <span className="icon is-small" style={{ color: '#F56F71' }}><i className="fa fa-heart"></i></span> by <a style={{ color: 'inherit' }} href="https://pennlabs.org/">Penn Labs</a> in Philadelphia
        </p>
        <a href="https://github.com/pennlabs/" style={{ marginRight: '1rem' }}>
          <span><i className="fab fa-github"></i></span>
        </a>
        <a href="https://www.facebook.com/labsatpenn/">
          <span><i className="fab fa-facebook-square"></i></span>
        </a>
      </div>
    </div>
  </footer>
)

export default Footer
