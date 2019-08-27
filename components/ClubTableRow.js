import React from 'react'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL } from '../utils'

class ClubTableRow extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: ''
    }
  }

  render() {
    const { club, openModal, updateFavorites, favorite } = this.props
    const { name, subtitle, tags } = club
    const img = club.image_url || getDefaultClubImageURL()
    return (
      <tr style={{ borderTop: '1px solid #e5e5e5', cursor: 'pointer' }}>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div className="column" onClick={() => openModal(club)}>
            <div className="columns is-gapless" style={{ padding: 10 }}>
              <div className="column is-4">
                <b className="is-size-6" style={{ color: CLUBS_GREY }}> {name} </b>
                <div>
                  {tags.map(tag => <span key={tag.id} className="tag is-rounded has-text-white" style={{ backgroundColor: CLUBS_BLUE, margin: 2, fontSize: '.7em' }}>{tag.name}</span>)}
                </div>
              </div>
              <div className="column is-8">
                <p style={{ color: CLUBS_GREY_LIGHT, fontSize: '.8rem', paddingLeft: 10 }}>{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <span className="icon" onClick={() => updateFavorites(club.id)} style={{ color: CLUBS_GREY, cursor: 'pointer', paddingRight: 20 }}>
              <i className={(favorite ? 'fas' : 'far') + ' fa-heart'} ></i>
            </span>
          </div>
        </div>
      </tr>
    )
  }
}

export default ClubTableRow
