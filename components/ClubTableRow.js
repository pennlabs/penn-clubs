import React from 'react'
import { CLUBS_GREY, CLUBS_PURPLE, CLUBS_GREY_LIGHT } from '../colors'

class ClubTableRow extends React.Component {

  constructor(props){
    super(props);
    this.state = {
        modal: '',
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
      <tr style={{borderTop: "1px solid #e5e5e5"}}>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div className="column">
            <div onClick={(e) => openModal(club)} className="columns is-gapless" style={{padding: 10}}>
              <div onCclassName="column is-4">
                <b className="is-size-6" style={{color: CLUBS_GREY}}> {name} </b>
                <div>
                  {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: CLUBS_PURPLE, margin: 2, fontSize: '.5em'}}>{this.findTagById(tag)}</span>)}
                </div>
              </div>
              <div onClick={(e) => openModal(club)} className="column is-8">
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
      </tr>
    )
  }
}

export default ClubTableRow
