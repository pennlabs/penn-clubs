import React from 'react'
import posed from 'react-pose'
import { CLUBS_BLUE, CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL } from '../utils'

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

  render() {
    var { club, openModal, updateFavorites, favorite } = this.props
    var { name, id, description, subtitle, tags } = club
    var img = club.img ? club.img : getDefaultClubImageURL()
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
                    {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: CLUBS_BLUE, margin: 2, fontSize: '.5em'}}>{this.findTagById(tag)}</span>)}
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
