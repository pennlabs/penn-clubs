import React from 'react'
import posed from 'react-pose'
import { CLUBS_PURPLE, CLUBS_GREY, CLUBS_GREY_LIGHT, CLUBS_PERIWINKLE } from '../colors'
import TagGroup from './TagGroup'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1 },
})


class ClubCard extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      modal: '',
      hovering: false,
    }
  }

  shorten(desc) {
    if (desc.length < 280) return desc
    else {
      return desc.slice(0, 280) + '...'
    }
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
      <div className="column is-half-desktop">
      <Pop
        pose={this.state.hovering ? "hovered" : "idle"}
        onMouseEnter={() => this.setState({ hovering: true })}
        onMouseLeave={() => this.setState({ hovering: false })}>
          <div
            className="card is-flex"
            style={{
              padding: 10,
              borderRadius: 3,
              minHeight: 240,
              boxShadow: "0 0 0 #fff",
              border: "1px solid #e5e5e5",
              backgroundColor: this.state.hovering ? "#FAFAFA" : "#fff"
            }}>
            <div onClick={(e) => openModal(club)} style={{cursor: "pointer"}}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 3px"}}>
                <b className="is-size-5" style={{color: CLUBS_GREY}}> {name} </b>
              </div>
              <TagGroup allTags={this.props.tags} clubTags={tags} />
              <div className="columns is-desktop is-gapless" style={{ padding: "10px 5px" }}>
                <div className="column is-narrow">
                  <img style={{ height: 120, width: 180, borderRadius: 3}} src={img} />
                </div>
                <div className="column">
                  <p style={{fontSize: ".8em", paddingLeft: 8, color: CLUBS_GREY_LIGHT}}>{this.shorten(subtitle)}</p>
                </div>
              </div>
            </div>
            <span className="icon" onClick={(e)=>updateFavorites(club.id)} style={{color: CLUBS_GREY, float:"right", padding: "10px 10px 0px 0px", cursor: "pointer"}}>
              <i className={(favorite ? "fas" : "far") + " fa-heart"} ></i>
            </span>
          </div>
        </Pop>
      </div>
    )
  }
}

export default ClubCard
