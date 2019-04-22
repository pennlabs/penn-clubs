import React from 'react'
import posed from 'react-pose'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1.02 },
})

class ClubList extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      modal: '',
      hovering: false,
    }
  }

  findTagById(id) {
    return this.props.tags.find(tag => tag.id == id).name
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
    var { club, openModal, updateFavorites, favorite } = this.props
    var { name, id, description, subtitle, tags } = club
    var img = club.img ? club.img : this.randomClub()
    club.img = img
    return (
      <div style={{margin: '.5rem'}}>
      <Pop
        pose={this.state.hovering ? "hovered" : "idle"}
        onMouseEnter={() => this.setState({ hovering: true })}
        onMouseLeave={() => this.setState({ hovering: false })}>
          <div
            className=" is-flex"
            style={{
              padding: "0 5px",
              borderRadius: 5,
              borderWidth: 1,
              boxShadow: "0px 2px 4px #d5d5d5",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between" }}>
            <div className="columns is-vcentered" style={{margin:0, cursor: "pointer"}} onClick={(e) => openModal(club)}>
              <div className="column is-1">
                <img src={img}/>
              </div>
              <div className="column is-flex" style={{flexDirection: "column"}}>
                <b className="is-size-6"> {name} </b>
                <div className="">
                  {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: "#8089f8", margin: 2, fontSize: '.65em'}}>{this.findTagById(tag)}</span>)}
                </div>
              </div>
              <div className="column is-7">
                <p style={{color:"#g3g3g3", fontSize: ".8rem"}}>{subtitle}</p>
              </div>
            </div>
            <span className="icon" onClick={(e)=>updateFavorites(club.id)} style={{cursor: "pointer", padding: "0px 30px"}}>
              <i className={(favorite ? "fas" : "far") + " fa-heart"} ></i>
            </span>
          </div>
        </Pop>
      </div>
    )
  }
}

export default ClubList
