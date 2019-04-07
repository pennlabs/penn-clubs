import React from 'react'
import posed from 'react-pose'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.02 },
})

class ClubCard extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      modal: '',
      hovering: false,
      favorite: false,
    }
  }

  findTagById(id, tags) {
    return tags.find(tag => tag.id == id).name
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
    var { club, favorite, tags, openModal, updateFavorites } = this.props
    var allTags = tags
    var { name, id, description, subtitle, tags } = club
    var img = club.img ? club.img : this.randomClub()
    club.img = img
    return (
      <div className="column is-half">
      <Pop
        pose={this.state.hovering ? "hovered" : "idle"}
        onMouseEnter={() => this.setState({ hovering: true })}
        onMouseLeave={() => this.setState({ hovering: false })}>
          <div className="card is-flex" style={{ padding: 10, borderRadius: 5, borderWidth: 1, boxShadow: "0px 2px 6px grey" }}>
            <div onClick={(e) => openModal(club)} style={{cursor: "pointer"}}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 10}}>
                <b className="is-size-4"> {name} </b>
              </div>
              {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: "#8089f8", margin: 5}}>{this.findTagById(tag, allTags)}</span>)}
              <div className="columns" style={{ padding: 10 }}>
                <div className="column">
                  <img style={{ height: 200 }} src={img} />
                </div>
                <div className="column">
                  <p>{subtitle}</p>
                </div>
              </div>
            </div>
            <span className="icon" onClick={(e)=>updateFavorites(club.id)} style={{float:"right", padding: "10px 10px 0px 0px", cursor: "pointer"}}>
              <i className={(favorite ? "fas" : "far") + " fa-heart"} ></i>
            </span>
          </div>
        </Pop>
      </div>
    )
  }
}

export default ClubCard
