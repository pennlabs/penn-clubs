import fetch from 'isomorphic-unfetch';
import Carousel from 'nuka-carousel';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Club = (props) => (
  <div>
    <Header />
    <div className="container" style={{marginTop: "3rem"}}>
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <h1 style={{fontWeight: 800, marginBottom: "1rem"}}>{props.club.name}</h1>
          <p style={{marginBottom: "1rem"}}>{props.club.description}</p>
          <Carousel>
            <img class="img-fluid" src="https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w" />
            <img class="img-fluid" src="https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w" />
            <img class="img-fluid" src="https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w" />
          </Carousel>
          <div className="row">
            <div className="col-md-6">
              <br />
              <h3 style={{fontWeight: 600}}>Upcoming Events:</h3>
              <a href="#" ><p> Previous Events</p></a>
              <div class="card">
                <div class="card-body">
                  <h5 class="card-title" >Coffee Bar</h5>
                  <h6 class="card-subtitle mb-2 text-muted">Sunday, December 8th at 6:00 PM</h6>
                  <p class="card-text">Enjoy free gourmet coffee brought to you by the best coffee brewers on campus. Bring your own mug.</p>
                  <a href="#" class="card-link">Penn Coffee Club</a>
                </div>
              </div>
              <br /> <br />
            </div>
          </div>
          <br /> <br />
        </div>
        <div class="col-md-4">
        <br /> <br />
          <div class="card" style={{marginBottom: "1rem"}}>
            <div class="card-header" style={{fontWeight: 600}}>
              Quick Facts
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><strong>15</strong> members</li>
              <li class="list-group-item"><strong>3</strong> years old</li>
              <li class="list-group-item"><i>Lots of gourmet coffee!</i></li>
            </ul>
          </div>
          <div class="card" style={{marginBottom: "1rem"}}>
            <div class="card-header" style={{fontWeight: 600}}>
              Members
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">Nadia Park</li>
              <li class="list-group-item">Max Schechter </li>
            </ul>
          </div>
          <div class="card" style={{marginBottom: "1rem"}}>
            <div class="card-header" style={{fontWeight: 600}}>
              Contact
            </div>
            <div class="card-body">
              penncoffeeclub@gmail.com
              facebook.com/penncoffeeclub
              instagram.com/penncoffeeclub
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
    name: "Penn Coffee Club",
    description: "We are a club about coffee -- our events usually center around drinking, tasting, and brewing the caffeinated drink. But we have expanded the club's focus to be beyond a beverage. \n\n Coffee is used as a medium for social interaction. We use that crucial trait, building low-stress environments for positive social interaction. Penn is a hyper-motivated and high pressure environment, where too often students fail to invest time in self-care. At this 'work hard/play hard' school, not enough emphasis is placed on spontaneous conversation. We try to create, foster, and inhabit a space to fill that void."
  };

  // const clubRequest = await fetch('https://platform.pennlabs.org/clubs');
  // const clubResponse = await clubRequest.json();
  return { club };
};

export default Club;