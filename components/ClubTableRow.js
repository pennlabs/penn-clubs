import React from 'react'
import s from 'styled-components'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT } from '../constants/colors'
import { getDefaultClubImageURL } from '../utils'
import FavoriteIcon from './common/FavoriteIcon'

const Row = s.tr`
  borderTop: 1px solid #e5e5e5;
  cursor: pointer;
`

const Tag = s.span`
  background-color: ${CLUBS_BLUE};
  margin: 2px;
  font-size: .7em;
`

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT};
  font-size: .8rem;
  padding-left: 10px;
`

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
      <Row>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div className="column" onClick={() => openModal(club)}>
            <div className="columns is-gapless" style={{ padding: 10 }}>
              <div className="column is-4">
                <b className="is-size-6" style={{ color: CLUBS_GREY }}> {name} </b>
                <div>
                  {tags.map(tag => <Tag key={tag.id} className="tag is-rounded has-text-white">{tag.name}</Tag>)}
                </div>
              </div>
              <div className="column is-8">
                <Subtitle>{subtitle}</Subtitle>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <FavoriteIcon club={club} favorite={favorite} updateFavorites={updateFavorites} />
          </div>
        </div>
      </Row>
    )
  }
}

export default ClubTableRow
