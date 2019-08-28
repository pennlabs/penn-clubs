import React from 'react'
import s from 'styled-components'
import { CLUBS_GREY, CLUBS_BLUE, CLUBS_GREY_LIGHT, HOVER_GRAY } from '../constants/colors'
import { getDefaultClubImageURL } from '../utils'
import FavoriteIcon from './common/FavoriteIcon'

const Row = s.div`
  border-top: 1px solid #e5e5e5;
  cursor: pointer;

  &:hover {
    background: ${HOVER_GRAY};
  }
`

const Tag = s.span`
  background-color: ${CLUBS_BLUE} !important;
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

  getSubtitle() {
    const { club } = this.props
    const { subtitle, description } = club

    if (subtitle) return subtitle

    if (description.length < 200) return description

    return description.substring(0, 200) + '...'
  }

  render() {
    const { club, openModal, updateFavorites, favorite } = this.props
    const { name, tags } = club

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
                <Subtitle>{this.getSubtitle()}</Subtitle>
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
