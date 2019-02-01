import fetch from 'isomorphic-unfetch'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Splash = () => (
  <div>
    <Header />
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <br />
          <br />
          <h1 style={{ fontWeight: 800 }}>
            Find your people.
            <span role="img" aria-label="Emoji I cannot see"> 🎉</span>
          </h1>
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
              <div className="row">
                <div className="col-md-6">
                  <a href="/?tag=coffee"> Coffee </a>
                  <br />
                  <a href="/?tag=coffee"> Entrepreneurship </a>
                  <br />
                  <a href="/?tag=dance"> Dance </a>
                  <br />
                </div>
                <div className="col-md-6">
                  <a href="/?tag=coffee"> Cultural </a>
                  <br />
                  <a href="/?tag=coffee"> Finance </a>
                  <br />
                  <a href="/?tag=dance"> Food </a>
                  <br />
                </div>
              </div>
            </div>
          </div>
          <br />
          <br />
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

Splash.getInitialProps = async () => {
  const clubRequest = await fetch('https://platform.pennlabs.org/engagement/clubs/')
  const clubResponse = await clubRequest.json()
  const eventsRequest = await fetch('https://platform.pennlabs.org/engagement/clubs/')
  const eventsResponse = await eventsRequest.json()

  return { clubs: clubResponse.clubs, events: eventsResponse.events }
}

export default Splash
