import React from 'react'
import s from 'styled-components'
import LazyLoad from 'react-lazy-load'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, WHITE, HOVER_GRAY, ALLBIRDS_GRAY
} from '../constants/colors'
import { BORDER_RADIUS } from '../constants/measurements'
import { getDefaultClubImageURL, stripTags } from '../utils'
import FavoriteIcon from './common/FavoriteIcon'
import TagGroup from './common/TagGroup'

const Card = s.div`
  padding: 10px;
  border-radius: ${BORDER_RADIUS};
  min-height: 240px;
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => hovering ? HOVER_GRAY : WHITE};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
`

const Image = s.img`
  height: 120px;
  width: 180px;
  border-radius: ${BORDER_RADIUS};
  object-fit: contain;
  text-align: left;
`

const CardHeader = s.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 3px;
`

class ClubCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: ''
    }
  }

  shorten(desc) {
    if (desc.length < 280) return desc
    return desc.slice(0, 280) + '...'
  }

  render() {
    const { club, openModal, updateFavorites, favorite } = this.props
    const { name, description, subtitle, tags } = club
    const img = club.image_url || getDefaultClubImageURL()
    return (
      <div className="column is-half-desktop">
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => openModal(club)}>
          <Card className="card is-flex">
            <div>
              <CardHeader>
                <strong className="is-size-5" style={{ color: CLUBS_GREY }}>{name}</strong>
              </CardHeader>
              {club.active || (
                <span
                  className="tag is-rounded has-text-white"
                  style={{ backgroundColor: CLUBS_GREY, margin: 2, fontSize: '.7em' }}>
                  Inactive
                </span>
              )}
              <TagGroup tags={tags} />
              <div className="columns is-desktop is-gapless" style={{ padding: '10px 5px' }}>
                <div className="column is-narrow">
                  <LazyLoad width={180} height={120} offset={1000}>
                    <Image src={img} alt={`${name} Logo`} />
                  </LazyLoad>
                </div>
                <div className="column">
                  <p style={{ paddingLeft: 15, color: CLUBS_GREY_LIGHT }}>
                    {this.shorten(subtitle || stripTags(description) || 'This club has no description.')}
                  </p>
                </div>
              </div>
            </div>
            <FavoriteIcon club={club} favorite={favorite} updateFavorites={updateFavorites} />
          </Card>
        </div>
      </div>
    )
  }
}

export default ClubCard
