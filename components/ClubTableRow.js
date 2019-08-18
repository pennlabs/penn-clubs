import React from 'react'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL } from '../utils'

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

  render() {
    var { club, openModal, updateFavorites, favorite } = this.props
    var { name, id, description, subtitle, tags } = club
    var img = club.img ? club.img : getDefaultClubImageURL()
    club.img = img
    return (
      <tr style={{borderTop: "1px solid #e5e5e5"}}>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div className="column" onClick={(e) => openModal(club)}>
            <div className="columns is-gapless" style={{padding: 10}}>
              <div className="column is-4">
                <b className="is-size-6" style={{color: CLUBS_GREY}}> {name} </b>
                <div>
                  {tags.map(tag => <span className="tag is-rounded has-text-white" style={{backgroundColor: CLUBS_BLUE, margin: 2, fontSize: '.5em'}}>{this.findTagById(tag)}</span>)}
                </div>
              </div>
              <div className="column is-8">
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
