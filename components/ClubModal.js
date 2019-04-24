import React from 'react'

class ClubModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  findTagById(id) {
    return this.props.tags.find(tag => tag.id == id).name
  }

  mapSize(size) {
    if (size == 1) return '0 - 20 Members'
    else if (size == 2) return '20 - 50 Members'
    else if (size == 3) return '50 - 100 Members'
    else return '100+ Members'
  }

  randomClub() {
    const clubs = ["https://files.slack.com/files-pri/T4EM1119V-FH9E8PE93/images.jpeg",
    "http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg",
    "https://files.slack.com/files-pri/T4EM1119V-FHA7CVCNT/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH920P727/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH958BEAW/image.png",
    "https://files.slack.com/files-pri/T4EM1119V-FH6NHNE0Y/seltzer.jpg",
    "https://s3.envato.com/files/990f2541-adb3-497d-a92e-78e03ab34d9d/inline_image_preview.jpg"
    ]
    const i = Math.floor(Math.random() * (6));
    return clubs[i];
  }

  render() {
    var { modal, club, closeModal, updateFavorites, favorite } = this.props
    return(
      <div className={"modal" + (modal ? 'is-active' : '')} id="modal" style={{position: "fixed", top: 0, height: "100%", width: "100%"}}>
        <div className="modal-background" onClick={(e)=>closeModal(club)} style={{backgroundColor: "#d5d5d5", opacity: .5, position: "fixed"}}></div>
        <div className="card" style={{ margin: "6rem", borderRadius: 3, borderWidth: 1, boxShadow: "0px 2px 6px rgba(0,0,0,.1)" }}>
          <span className="icon" onClick={(e)=>closeModal(club)} style={{float:"right", cursor: "pointer", margin:10}}>
            <i className="fas fa-times"></i>
          </span>
          <div style={{padding: "20px 40px"}}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5}}>
              <b className="is-size-2"> {club.name} </b>
              <span className="icon" onClick={(e)=>updateFavorites(club.id)} style={{float:"right", padding: "10px 10px 0px 0px", cursor: "pointer"}}>
                <i className={(favorite ? "fas" : "far") + " fa-heart"} ></i>
              </span>
            </div>
            <div className="columns" style={{marginBottom: 20}}>
              <div className="column">
                <div style={{display:"flex", flexDirection:"column", justifyContent: "space-between", height: 400}}>
                  <img style={{ height: 220, width: 330, borderRadius: 3 }} src={club.img ? club.img : this.randomClub()} />
                  <div>
                    {club.tags ? club.tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: "#8089f8", margin: 3}}>{this.findTagById(tag)}</span>) : ""}
                  </div>
                  <div style={{borderRadius: 3, backgroundColor: "#f2f2f2", height: 100, width: 330, padding: 10, display: "flex", flexDirection:"column", justifyContent: "space-around"}}>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                      <b className="is-size-6">Membership:</b>
                      <span className="tag is-rounded has-text-dark" style={{margin: 3, backgroundColor:"#ccc", fontSize: ".7em"}}>{this.mapSize(club.size)}</span>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                      <b className="is-size-6">Requires Application:</b>  <span className="tag is-rounded has-text-dark" style={{margin: 3, backgroundColor:"#ccc", fontSize: ".7em"}}>{club.application_required ? "Yes" : "No"}</span>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                      <b className="is-size-6">Currently Recruiting:</b> <span className="tag is-rounded has-text-dark" style={{margin: 3, backgroundColor:"#ccc", fontSize: ".7em"}}>{club.accepting_applications ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column is-8">
                <p className="has-text-justified is-size-6" style={{height: 400, overflowY: "auto", paddingRight: 10}}>{club.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ClubModal
