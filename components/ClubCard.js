import React from 'react'
import s from 'styled-components'
import LazyLoad from 'react-lazy-load'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, WHITE, HOVER_GRAY, ALLBIRDS_GRAY
} from '../constants/colors'
import { BORDER_RADIUS, mediaMaxWidth, SM, mediaMinWidth, MD } from '../constants/measurements'
import { getDefaultClubImageURL, stripTags } from '../utils'
import FavoriteIcon from './common/FavoriteIcon'
import TagGroup from './common/TagGroup'
import { InactiveTag } from './common/Tags'

const CardWrapper = s.div`
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const Description = s.p`
  color: ${CLUBS_GREY_LIGHT};

  ${mediaMinWidth(MD)} {
    margin-left: 10px;
  }
`

const Card = s.div`
  padding: 10px;
  border-radius: ${BORDER_RADIUS};
  min-height: 240px;
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => hovering ? HOVER_GRAY : WHITE};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: 100%;

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const Image = s.img`
  height: 100px;
  width: 150px;
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

const CardTitle = s.strong`
  line-height: 1.2;
  color: ${CLUBS_GREY};
  margin-bottom: 0.5rem;
`

class ClubCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: ''
    }
  }

  shorten(desc) {
    if (desc.length < 250) return desc
    return desc.slice(0, 250) + '...'
  }

  render() {
    const { club, openModal, updateFavorites, favorite, selectedTags, updateTag } = this.props
    const { name, description, subtitle, tags } = club
    const img = club.image_url || getDefaultClubImageURL()
    return (
      <CardWrapper className="column is-half-desktop">
        <div
          style={{ cursor: 'pointer', height: '100%' }}
          onClick={() => openModal(club)}>
          <Card className="card">
            <div>
              <div>
                <FavoriteIcon
                  club={club}
                  favorite={favorite}
                  updateFavorites={updateFavorites}
                  padding="0"
                />
                <CardHeader>
                  <CardTitle className="is-size-5">{name}</CardTitle>
                </CardHeader>
              </div>
            </div>
            {club.active || (
              <InactiveTag className="tag is-rounded">
                Inactive
              </InactiveTag>
            )}
            <TagGroup
              tags={tags}
              selectedTags={selectedTags}
              updateTag={updateTag}
            />
            <div className="columns is-vcentered is-desktop is-gapless" style={{ padding: '10px 5px' }}>
              <div className="column is-narrow" style={{ height: '100%' }}>
                <LazyLoad width={150} height={100} offset={1000}>
                  <Image src={img} alt={`${name} Logo`} />
                </LazyLoad>
              </div>
              <div className="column">
                <Description>
                  {this.shorten(subtitle || stripTags(description) || 'This club has no description.')}
                </Description>
              </div>
            </div>
          </Card>
        </div>
      </CardWrapper>
    )
  }
}

export default ClubCard
