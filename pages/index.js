import fetch from 'isomorphic-unfetch'
import PropTypes from 'prop-types'
import Header from '../components/Header'
import Footer from '../components/Footer'


const Splash = (props) => {
  const { clubs, tags } = props
  return (
    <div>
      <Header />
      <div className="container">
        <div className="row justify-content-md-center">
          <div className="col-md-8">
            <br />
            <br />
            <h1 style={{ fontWeight: 800 }}>Find your people. 🎉</h1>
            <input
              placeholder="Search interests, name etc."
              style={{
                width: '80%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: '400',
                marginTop: '0.5rem',
                borderRadius: '10px',
                border: '1px solid #cccccc',
              }}
            />
            <br />
            <p style={{ marginTop: '1rem', marginBottom: '0.3rem' }}>
              Filter by:
              <a href="/"><span style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }} className="badge badge-secondary">General Membership</span></a>
              <a href="/"><span style={{ marginRight: '0.5rem' }} className="badge badge-secondary">Open Applications</span></a>
              <a href="/"><span style={{ marginRight: '0.5rem' }} className="badge badge-secondary">Recently Founded</span></a>
            </p>
            <br />
            <div className="card" style={{ width: '80%' }}>
              <div className="card-header">
                Categories
              </div>
              <div className="card-body">
                { tags.map(tag => <a style={{ padding: 5 }} href={tag.link}>{tag.name}</a>)}
              </div>
            </div>
            <br />
            <br />
            <div>
              { clubs.map(club => (
                <a href={`/club?club=${club.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ width: '80%' }}>
                    <div className="card-body">
                      <h5 className="card-title">{club.name}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">{club.description}</h6>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="col-md-4">
            <br />
            <br />
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Upcoming Events </h3>
            <div className="row">
              <div className="col-md-12">
                <div className="card" style={{ marginRight: '0.2rem' }}>
                  <div className="card-body">
                    <h5 className="card-title">Coffee Bar</h5>
                    <h6 className="card-subtitle mb-2 text-muted">Sunday, December 8th at 6:00 PM</h6>
                    <p className="card-text">Enjoy free gourmet coffee brought to you by the best coffee brewers on campus. Bring your own mug.</p>
                    <a href="/club" className="card-link">Penn Coffee Club</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

Splash.getInitialProps = async function getProps() {
  const clubRequest = await fetch('https://clubs.pennlabs.org/clubs')
  const clubResponse = await clubRequest.json()
  const tags = [{ name: 'Coffee', link: 'coffee' }, { name: 'Dance', link: 'dance' }, { name: 'Cultural', link: 'cultural' }]
  return { clubs: clubResponse, tags }
}

Splash.propTypes = {
  clubs: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  tags: PropTypes.shape({
    name: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
  }).isRequired,
}

export default Splash
