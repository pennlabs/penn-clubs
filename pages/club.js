import fetch from 'isomorphic-unfetch'
import renderPage from '../renderPage.js'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../colors'
import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

class Club extends React.Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  mapSize(size) {
    if (size == 1) return '0 - 20 Members'
    else if (size == 2) return '20 - 50 Members'
    else if (size == 3) return '50 - 100 Members'
    else return '100+ Members'
  }

  findTagById(id) {
    return this.props.tags.find(tag => tag.id == id).name
  }

  randomClub() {
    const clubs = [
    "http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg",

    ]
    const i = Math.floor(Math.random() * (0));
    return clubs[i];
  }

  render() {

    const { club, tags } = this.props
    return (
      <div>
       <Header />
       <div  style={{padding: "30px 50px"}}>
        <div className="is-flex" style={{justifyContent: "space-between", flexDirection: "row", alignItems: "center", paddingRight: 10}}>
          <h1 className='title is-size-1-desktop is-size-3-mobile' style={{color: CLUBS_GREY, marginBottom: 10}} >
           {club.name}
          </h1>
          <i className="fas fa-heart" style={{fontSize: "1.5em"}}></i>
        </div>
         <div style={{marginBottom: 20}}>
          {club.tags.map(tag => <span class="tag is-rounded" style={{backgroundColor: CLUBS_BLUE, color: "#fff", margin: 3,}}>{this.findTagById(tag)} </span>)}
         </div>
         <div className="columns">
          <div className="column is-6">
            <img src={this.randomClub()} style={{width: "100%", borderRadius: 3, marginBottom: 10}}/>
            <div className="columns">
              <div className="column is-6" style={{backgroundColor: "#f2f2f2", borderRadius: 3, margin:"5px 5px 5px 0"}}>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <b className="is-size-6 is-size-7-mobile"> Membership: </b>
                  <span class="tag is-rounded has-text-dark" style={{backgroundColor: "#ccc", color: "#fff", fontSize: ".7rem", margin: 2}}>{this.mapSize(this.size)} </span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <b className="is-size-6"> Requires Application: </b>
                  <span class="tag is-rounded has-text-dark" style={{backgroundColor: "#ccc", color: "#fff", fontSize: ".7rem", margin: 2}}>{club.application_required ? "Yes" : "No"} </span>
                </div>
                <div style={{display: "flex", justifyContent: "space-between"}}>
                  <b className="is-size-6"> Currently Recruiting </b>
                  <span class="tag is-rounded has-text-dark" style={{backgroundColor: "#ccc", color: "#fff", fontSize: ".7rem", margin: 2}}>{club.accepting_applications ? "Yes" : "No"} </span>
                </div>
              </div>
              <div className="column is-6" style={{backgroundColor: "#f2f2f2", borderRadius: 3, margin:"5px 0 5px 5px"}}>
                <div style={{display: "flex", justifyContent: "space-evenly", padding: "10px 0px 10px 0px"}}>
                  <div className="has-text-centered">
                    <a href={club.facebook} style={{color: CLUBS_GREY}}>
                      <span className="icon">
                        <i class="fab fa-facebook-square fa-3x" style={{height: "100%"}}></i>
                      </span>
                    </a>
                    <h6>Facebook</h6>
                  </div>
                  <div className="has-text-centered">
                    <a href={`mailto:${club.email}`} style={{color: club.email ? CLUBS_GREY : "#CCC"}}>
                      <span className="icon">
                        <i class="fas fa-at fa-3x" style={{height: "100%"}}></i>
                      </span>
                    </a>
                    <h6 style={{color: club.email ? CLUBS_GREY : "#CCC"}}>Email</h6>
                  </div>
                  <div className="has-text-centered">
                    <a href={club.website} style={{color: "#ccc"}}>
                      <span className="icon">
                        <i class="fas fa-link fa-3x" style={{height: "100%"}}></i>
                      </span>
                    </a>
                    <h6 style={{color: "#CCC"}}>Website</h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="column is-6">
            <p>
              {club.description}
            </p>
          </div>
       </div>
     </div>
     <Footer />
    </div>
    )
  }
}

Club.getInitialProps = async (props) => {
  const tagsRequest = await fetch('https://clubs.pennlabs.org/tags/?format=json')
  const tagsResponse = await tagsRequest.json()
  var { query } = props
  const clubRequest = await fetch(`https://clubs.pennlabs.org/clubs/${query.club}/?format=json`)
  const clubResponse = await clubRequest.json()
  return { club: clubResponse, tags: tagsResponse }
}



export default Club
