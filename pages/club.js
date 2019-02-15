import fetch from 'isomorphic-unfetch'
import { Converter } from 'react-showdown'
import PropTypes from 'prop-types'
import Carousel from 'nuka-carousel'
import Header from '../components/Header'
import Footer from '../components/Footer'

const rConverter = new Converter()

const Club = (props) => {
  const { club } = props
  return (
    <div>
      <Header />
      <div className="container" style={{ marginTop: '3rem' }}>
        <div className="row justify-content-md-center">
          <div className="col-md-8">
            <h1 style={{ fontWeight: 800, marginBottom: '1rem' }}>{club.name}</h1>
            {rConverter.convert(club.description)}
            <Carousel>
              {club.imgs ? club.imgs.map(img => <img className="img-fluid" src={img} alt="" />) : []}
            </Carousel>
            <br />
            <br />
          </div>
          <div className="col-md-4">
            <a href="/" style={{ float: 'right' }}> Back to all clubs</a>
            <br />
            <br />
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header" style={{ fontWeight: 600 }}>
                Quick Facts
              </div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>{club.size}</strong>
                  members
                </li>
                <li className="list-group-item">
                  Founded on
                  {club.founded}
                </li>
                <li className="list-group-item"><i>{club.fact}</i></li>
              </ul>
            </div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-header" style={{ fontWeight: 600 }}>
                Contact
              </div>
              <div className="card-body">
                <a href={club.facebook} style={{ display: 'flex', padding: 5 }}>
                  <ion-icon size="large" name="logo-facebook" />
                  <p style={{ marginBottom: 0 }}>Facebook</p>
                </a>
                <a href={`mailto:${club.email}`} style={{ display: 'flex', padding: 5 }}>
                  <ion-icon size="large" name="mail" />
                  <p style={{ marginBottom: 0 }}>Email</p>
                </a>
                <br />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

Club.getInitialProps = async function getProps(props) {
  const { query } = props
  const clubRequest = await fetch(`https://clubs.pennlabs.org/clubs/${query.club}`)
  const clubResponse = await clubRequest.json()
  clubResponse.imgs = []
  const tags = [{ name: 'Coffee', link: 'coffee' }, { name: 'Dance', link: 'dance' }, { name: 'Cultural', link: 'cultural' }]
  return { club: clubResponse, tags }
}

Club.propTypes = {
  club: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
}

export default Club
