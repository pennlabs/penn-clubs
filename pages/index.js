import fetch from 'isomorphic-unfetch';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Splash = (props) => (
  <div>
    <Header />
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-md-8">
          <br /> <br />
          <h1 style={{fontWeight: 800}}>Find your people. 🎉</h1>
          <input placeholder="Search interests, name etc."
          style={{
            width: "80%",
            padding: "1rem",
            fontSize: "1rem",
            fontWeight: "400",
            marginTop: "0.5rem",
            borderRadius: "10px",
            border: "1px solid #cccccc"}}
          />
          <br />
          <p style={{marginTop: "1rem", marginBottom: "0.3rem"}}>
            Filter by:
            <a href="/"><span style={{marginLeft: "0.5rem", marginRight: "0.5rem"}} class="badge badge-secondary">General Membership</span></a>
            <a href="/"><span style={{marginRight: "0.5rem"}} class="badge badge-secondary">Open Applications</span></a>
            <a href="/"><span style={{marginRight: "0.5rem"}} class="badge badge-secondary">Recently Founded</span></a>
          </p>
          <br />
          <div class="card" style={{width: "80%"}}>
            <div class="card-header">
              Categories
            </div>
            <div class="card-body">
              {props.tags.map((tag) => <a style={{padding: 5}} href={tag.link}>{tag.name}</a>)}
            </div>
          </div>
          <br /> <br />
              {props.clubs.map((club) => (
                <a href="/club" style={{textDecoration: "none"}}>
                  <div className="card" style={{width: "80%"}}>
                    <div className="card-body">
                      <h5 class="card-title">{club.name}</h5>
                      <h6 class="card-subtitle mb-2 text-muted">{club.description}</h6>
                    </div>
                  </div>
                </a>
              ))}
          </div>
          <div className="col-md-4">
            <br /> <br />
            <h3 style={{fontWeight: 800, marginBottom: "1.5rem"}}>Upcoming Events </h3>
            <div className="row">
              <div className="col-md-12">
                <div class="card" style={{marginRight: "0.2rem"}}>
                  <div class="card-body">
                    <h5 class="card-title" >Coffee Bar</h5>
                    <h6 class="card-subtitle mb-2 text-muted">Sunday, December 8th at 6:00 PM</h6>
                    <p class="card-text">Enjoy free gourmet coffee brought to you by the best coffee brewers on campus. Bring your own mug.</p>
                    <a href="/club" class="card-link">Penn Coffee Club</a>
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

Splash.getInitialProps = async function() {
  const clubRequest = await fetch('https://platform.pennlabs.org/engagement/clubs/');
  const clubResponse = await clubRequest.json();
  const eventsRequest = await fetch('https://platform.pennlabs.org/engagement/clubs/');
  const eventsResponse = await eventsRequest.json();
  const tags = [{name: "Coffee", link: "coffee"}, {name:"Dance", link: "dance"}, {name: "Cultural", link: "cultural"}]
  const clubs = [{
        "name": "Penn Coffee Club",
        "id": "penncoffeeclub",
        "description": "A club for *coffee lovers*.",
        "founded": "2015-01-30",
        "fact": "Used to be sceney.",
        "size": 10,
        "email": "penncoffeeclub@gmail.com",
        "facebook": "https://www.facebook.com/penncoffeeclub/",
        "imgs": ["https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w", "https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w", "https://static1.squarespace.com/static/5739ee887da24fc27bc8933f/573b383b40261d950407cbe9/580402ebb3db2b014695a3c7/1476657915249/2.jpg?format=2500w"]
    }]
  return { clubs: clubs, events: eventsResponse.events, tags: tags };
};

export default Splash;
