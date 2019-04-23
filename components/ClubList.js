import React from 'react'
import posed from 'react-pose'
import { CLUBS_PURPLE, CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'

const Pop = posed.div({
  idle: { },
  hovered: { },
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
      <Pop
        style={{width: "100%"}}
        pose={this.state.hovering ? "hovered" : "idle"}
        onMouseEnter={() => this.setState({ hovering: true })}
        onMouseLeave={() => this.setState({ hovering: false })}>
        <div style={{ padding: "0 5px", borderRadius: 3, border: "1px solid #e5e5e5", backgroundColor: this.state.hovering ? "#FAFAFA" : "#fff", margin: '.5rem', width: "100%"}}>
          <div className="columns is-vcentered is-gapless is-mobile">
            <div onClick={(e) => openModal(club)} className="column">
              <div className="columns is-gapless is-vcentered" style={{padding: 10, width: "100%"}}>
                <div className="column is-narrow">
                  <img style={{ height: 60, width: 90, borderRadius: 3}} src={img} />
                </div>
                <div className="column is-4" style={{marginLeft: 20}}>
                  <b className="is-size-6" style={{color: CLUBS_GREY}}> {name} </b>
                  <div>
                    {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: CLUBS_PURPLE, margin: 2, fontSize: '.5em'}}>{this.findTagById(tag)}</span>)}
                  </div>
                </div>
                <div className="column">
                  <p style={{color: CLUBS_GREY_LIGHT, fontSize: ".8rem", paddingLeft: 10}}>{subtitle}</p>
                </div>
              </div>
            </div>
            <div className="column is-narrow">
              <span className="icon" onClick={(e)=>updateFavorites(club.id)} style={{color: CLUBS_GREY, cursor: "pointer", paddingRight: 20}}>
                <i className={(favorite ? "fas" : "far") + " fa-heart"} ></i>
              </span>
            </div>
          </div>
        </div>
        </Pop>

    )
  }
}

export default ClubList
