import React from 'react'

class ClubCard extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      modal: '',
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

  openModal(e) {
    console.log("open meeee")
    e.preventDefault()
    this.props.openModal(this.props.club)
  }

  render() {
    var props = this.props
    var { name, id, img, description, tags } = props.club
    var allTags = props.tags
    return (
        <div className="column is-half">
          <div className="card" onClick={(e) => this.openModal(e)} style={{ padding: 10, borderRadius: 5, borderWidth: 1, boxShadow: "0px 2px 6px grey" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: 10}}>
              <b className="is-size-4"> {props.club.name} </b>
              <a className="button" style={{ color: "#fff", backgroundColor: "#8089f8", borderWidth: 0 }}><b>Add</b></a>
            </div>
            {tags.map(tag => <span className="tag is-rounded" style={{backgroundColor: "", margin: 5}}>{this.findTagById(tag, allTags)}</span>)}
            <div className="columns" style={{ padding: 10 }}>
              <div className="column">
                <img style={{ height: 200 }} src={props.club.img ? props.club.img : this.randomClub()} />
              </div>
              <div className="column">
                <p style={{ }}>{props.club.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
    )
  }
}

export default ClubCard
