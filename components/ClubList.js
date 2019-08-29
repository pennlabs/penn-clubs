import React from 'react'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, WHITE, HOVER_GRAY, ALLBIRDS_GRAY
} from '../constants/colors'
import { Tag, InactiveTag } from './common/Tags'
import { BORDER_RADIUS } from '../constants/measurements'
import { getDefaultClubImageURL } from '../utils'
import s from 'styled-components'

const FavoriteIcon = s.span`
  color: ${CLUBS_GREY};
  cursor: pointer;
  padding-right: 20px;
`

const Wrapper = s.div`
  padding: 0 5px;
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${ALLBIRDS_GRAY};
  background-color: ${({ hovering }) => hovering ? HOVER_GRAY : WHITE};
  margin: .5rem;
  width: 100%;
`

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT} !important;
  font-size: .8rem;
  padding-left: 10px;
`

const Image = s.img`
  height: 60px;
  width: 90px;
  border-radius: ${BORDER_RADIUS};
`

class ClubList extends React.Component {
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
      <Wrapper>
        <div className="columns is-vcentered is-gapless is-mobile">
          <div onClick={() => openModal(club)} className="column">
            <div className="columns is-gapless is-vcentered" style={{ padding: 10, width: '100%' }}>
              <div className="column is-narrow">
                <Image src={img} />
              </div>
              <div className="column is-4" style={{ marginLeft: 20 }}>
                <strong className="is-size-6" style={{ color: CLUBS_GREY }}>{name}</strong>
                <div>
                  {club.active || (
                    <InactiveTag className="tag is-rounded has-text-white">
                      Inactive
                    </InactiveTag>
                  )}
                  {tags.map(tag => (
                    <Tag key={tag.id} className="tag is-rounded has-text-white">
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              </div>
              <div className="column">
                <Subtitle>{subtitle}</Subtitle>
              </div>
            </div>
          </div>
          <div className="column is-narrow">
            <FavoriteIcon className="icon" onClick={() => updateFavorites(club.id)}>
              <i className={(favorite ? 'fas' : 'far') + ' fa-heart'} ></i>
            </FavoriteIcon>
          </div>
        </div>
      </Wrapper>
    )
  }
}

export default ClubList
