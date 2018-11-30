import fetch from 'isomorphic-unfetch';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Club = (props) => (
  <div>
    <Header />
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <br /> <br />
          <h1 style={{fontWeight: 800, marginBottom: "1rem"}}>Penn Coffee Club</h1>
          <img class="img-fluid" src="https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w" />
          <br /> <br />
          <h3 style={{fontWeight: 800, marginBottom: "1.5rem"}}>Upcoming Events:</h3>
          <div className="row">
            <div className="col-md-6">
              <div class="card" style={{marginRight: "0.5rem"}}>
                <div class="card-body">
                  <h5 class="card-title" >Coffee Bar</h5>
                  <h6 class="card-subtitle mb-2 text-muted">Sunday, December 8th at 6:00 PM</h6>
                  <p class="card-text">Enjoy free gourmet coffee brought to you by the best coffee brewers on campus. Bring your own mug.</p>
                  <a href="#" class="card-link">Penn Coffee Club</a>
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

Club.getInitialProps = async function() {
  // const clubRequest = await fetch('https://platform.pennlabs.org/clubs');
  // const clubResponse = await clubRequest.json();
  // return { clubs: clubResponse.clubs };
  return {};
};

export default Club;