import React from 'react'
import s from 'styled-components'
import { CLUBS_GREY, CLUBS_GREY_LIGHT, HOVER_GRAY } from '../constants/colors'
import { mediaMaxWidth, MD, SM } from '../constants/measurements'
import FavoriteIcon from './common/FavoriteIcon'
import TagGroup from './common/TagGroup'

const Row = s.div`
  cursor: pointer;

  &:hover {
    background: ${HOVER_GRAY};
  }

  ${mediaMaxWidth(SM)} {
    padding: 0 0.25rem;
  }
`

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT};
  font-size: .8rem;
  padding-left: 10px;

  ${mediaMaxWidth(MD)} {
    padding-left: 0;
  }
`

class ClubTableRow extends React.Component {
  getSubtitle() {
    const { club } = this.props
    const { subtitle, description } = club

    if (subtitle) return subtitle

    if (description.length < 200) return description

    return description.substring(0, 200) + '...'
  }

  render() {
    const { club, openModal, updateFavorites, favorite, selectedTags, updateTag } = this.props
    const { name, tags } = club

    return (
      <Row>
        <div className="columns is-gapless is-mobile">
          <div className="column" onClick={() => openModal(club)}>
            <div className="columns is-gapless" style={{ padding: 10 }}>
              <div className="column is-4-desktop is-12-mobile">
                <b className="is-size-6" style={{ color: CLUBS_GREY }}> {name} </b>
                <TagGroup 
                  tags={tags}
                  selectedTags={selectedTags}
                  updateTag={updateTag}
                />
              </div>
              <div className="column is-8-desktop is-12-mobile">
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
