import React from 'react'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL } from '../utils'
import { Link } from '../routes'

class ClubModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
    }
  }

  mapSize(size) {
    if (size === 1) return '0 - 20 Members'
    else if (size === 2) return '20 - 50 Members'
    else if (size === 3) return '50 - 100 Members'
    else return '100+ Members'
  }

  render() {
    var { modal, club, closeModal, updateFavorites, favorite } = this.props
    var { name, id, tags, image_url, size, application_required, accepting_applications, description } = club
    return (
      <div className={'modal' + (modal ? 'is-active' : '')} id="modal" style={{ position: 'fixed', top: 0, height: '100%', width: '100%' }}>
        <div className="modal-background" onClick={(e) => closeModal(club)} style={{ backgroundColor: '#d5d5d5', opacity: 0.5, position: 'fixed' }}></div>
        <div className="card" style={{ margin: '6rem', borderRadius: 3, borderWidth: 1, boxShadow: '0px 2px 6px rgba(0,0,0,.1)' }}>
          <span className="icon" onClick={(e) => closeModal(club)} style={{ float: 'right', cursor: 'pointer', margin: 10, color: CLUBS_GREY }}>
            <i className="fas fa-times"></i>
          </span>
          <div style={{ padding: '20px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <b style={{ color: CLUBS_GREY }} className="is-size-2"> {name} </b>
              <span className="icon" onClick={(e) => updateFavorites(id)} style={{ float: 'right', padding: '10px 10px 0px 0px', cursor: 'pointer', color: CLUBS_GREY }}>
                <i className={(favorite ? 'fas' : 'far') + ' fa-heart'} ></i>
              </span>
            </div>
            <div className="columns">
              <div className="column is-4-desktop is-5-mobile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 400 }}>
                <img style={{ height: 220, width: 330, borderRadius: 3, objectFit: 'contain' }} src={image_url || getDefaultClubImageURL()} />
                <div>
                  {tags ? tags.map(tag => <span key={tag.id} className="tag is-rounded has-text-white" style={{ backgroundColor: CLUBS_BLUE, margin: 3 }}>{tag.name}</span>) : ''}
                </div>
                <div style={{ borderRadius: 3, backgroundColor: '#f2f2f2', height: 100, width: 330, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b style={{ color: CLUBS_GREY }} className="is-size-6">Membership:</b>
                    <span className="tag is-rounded" style={{ margin: 3, color: CLUBS_GREY, backgroundColor: '#ccc', fontSize: '.7em' }}>{this.mapSize(size)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b style={{ color: CLUBS_GREY }} className="is-size-6">Requires Application:</b>  <span className="tag is-rounded" style={{ margin: 3, backgroundColor: '#ccc', fontSize: '.7em' }}>{application_required ? 'Yes' : 'No'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <b style={{ color: CLUBS_GREY }} className="is-size-6">Currently Recruiting:</b> <span className="tag is-rounded" style={{ margin: 3, backgroundColor: '#ccc', fontSize: '.7em' }}>{accepting_applications ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
              <div className="column is-8-desktop is-7-mobile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 400 }}>
                <div className="has-text-justified is-size-6-desktop is-size-7-touch" style={{ height: 370, overflowY: 'auto', color: CLUBS_GREY_LIGHT }} dangerouslySetInnerHTML={{ __html: description }} />
                <Link route='club-view' params={{ club: String(id) }}>
                  <a className="button" target="_blank" style={{ padding: 10, margin: 5, float: 'right', borderWidth: 0, backgroundColor: '#f2f2f2', color: CLUBS_GREY }}>See More...</a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ClubModal
