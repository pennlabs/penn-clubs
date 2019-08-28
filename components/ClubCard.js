import React from 'react'
import posed from 'react-pose'
import s from 'styled-components'
import LazyLoad from 'react-lazy-load'
import { CLUBS_BLUE, CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL, stripTags } from '../utils'

// TODO what is this "Pop" thing
const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1 }
})

const Card = s.div`
  padding: 10px;
  border-radius: 3px;
  min-height: 240px;
  box-shadow: 0 0 0 #fff;
  border: 1px solid #e5e5e5;
  background-color: ${({ hovering }) => hovering ? '#FAFAFA' : '#fff'};
  justify-content: space-between;
`

const Image = s.img`
  height: 120px;
  width: 180px;
  border-radius: 3px;
  object-fit: contain;
  text-align: left;
`

const CardHeader = s.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 3px;
`

const FavoriteIcon = s.span`
  color: ${CLUBS_GREY};
  float: right;
  padding: 10px 10px 0 0;
  cursor: pointer;
`

class ClubCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: '',
      hovering: false
    }
  }

  shorten(desc) {
    if (desc.length < 280) return desc
    return desc.slice(0, 280) + '...'
  }

  render() {
    const { club, openModal, updateFavorites, favorite } = this.props
    const { hovering } = this.state
    const { name, description, subtitle, tags } = club
    const img = club.image_url || getDefaultClubImageURL()
    return (
      <div className="column is-half-desktop">
        <Pop
          pose={hovering ? 'hovered' : 'idle'}
          style={{ cursor: 'pointer' }}
          onClick={() => openModal(club)}
          onMouseEnter={() => this.setState({ hovering: true })}
          onMouseLeave={() => this.setState({ hovering: false })}>
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
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="tag is-rounded has-text-white"
                  style={{ backgroundColor: CLUBS_BLUE, margin: 2, fontSize: '.7em' }}>
                  {tag.name}
                </span>
              ))}
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
            <FavoriteIcon
              className="icon"
              onClick={(e) => { updateFavorites(club.id); e.stopPropagation() }}>
              <i className={(favorite ? 'fas' : 'far') + ' fa-heart'} ></i>
            </FavoriteIcon>
          </Card>
        </Pop>
      </div>
    )
  }
}

export default ClubCard
