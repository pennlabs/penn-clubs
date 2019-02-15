// import fetch from 'isomorphic-unfetch'
import PropTypes from 'prop-types'
import Carousel from 'nuka-carousel'
import Header from '../components/Header'
import Footer from '../components/Footer'

const Club = ({ club: { name, description } }) => (
  <div>
    <Header />
    <div className="container" style={{ marginTop: '3rem' }}>
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <h1 style={{ fontWeight: 800, marginBottom: '1rem' }}>{name}</h1>
          <p style={{ marginBottom: '1rem' }}>{description}</p>
          <Carousel>
            {props.club.imgs.map((img) =>
              <img class="img-fluid" src={img} />
            )}
          </Carousel>
          <br /> <br />
        </div>
        <div class="col-md-4">
        <a href="/" style={{float: "right"}}> Back to all clubs</a>
        <br /> <br />
          <div class="card" style={{marginBottom: "1rem"}}>
            <div class="card-header" style={{fontWeight: 600}}>
              Quick Facts
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><strong>{props.club.size}</strong> members</li>
              <li class="list-group-item">Founded on {props.club.founded}</li>
              <li class="list-group-item"><i>{props.club.fact}</i></li>
            </ul>
          </div>

          <div class="card" style={{marginBottom: "1rem"}}>
            <div class="card-header" style={{fontWeight: 600}}>
              Contact
            </div>
            <div class="card-body">
              <a href={props.club.facebook} style={{display: "flex", padding: 5}}>
                <ion-icon size="large" name="logo-facebook"></ion-icon>
                <p style={{marginBottom: 0}}>Facebook</p>
              </a>
              <a href={"mailto:" + props.club.email} style={{display: "flex", padding: 5}}>
                <ion-icon size="large" name="mail"></ion-icon>
                <p style={{marginBottom: 0}}>Email</p>
              </a>
              <br/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
)

Club.getInitialProps = async function(props) {
  const { query } = props;

  const club = {
      "name": "Penn Coffee Club",
      "id": "penncoffeeclub",
      "description": "A club for *coffee lovers*.",
      "founded": "2015-01-30",
      "fact": "Used to be sceney.",
      "size": 10,
      "email": "penncoffeeclub@gmail.com",
      "facebook": "https://www.facebook.com/penncoffeeclub/",
      "imgs": ["https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w", "https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w", "https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w"]
  }
  // const clubRequest = await fetch('https://platform.pennlabs.org/clubs');
  // const clubResponse = await clubRequest.json();
  return { club }
}

Club.propTypes = {
  club: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
}

export default Club;
