import React from 'react'
import posed from 'react-pose'
import { CLUBS_BLUE, CLUBS_GREY, CLUBS_GREY_LIGHT } from '../colors'
import { getDefaultClubImageURL } from '../utils'
import s from 'styled-components'

const FavoriteIcon = s.span`
  color: ${CLUBS_GREY};
  cursor: pointer;
  padding-right: 20px;
`

const Wrapper = s.div`
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid #e5e5e5;
  background-color: ${({ hovering }) => hovering ? '#FAFAFA' : '#fff'};
  margin: .5rem;
  width: 100%;
`

const Subtitle = s.p`
  color: ${CLUBS_GREY_LIGHT};
  font-size: .8rem;
  padding-left: 10px;
`

const Image = s.img`
  height: 60px;
  width: 90px;
  borderRadius: 3px;
`

const Pop = posed.div({
  idle: {},
  hovered: {}
})

class ClubList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: '',
      hovering: false
    }
  }

  render() {
    const { club, openModal, updateFavorites, favorite } = this.props
    const { hovering } = this.state
    const { name, subtitle, tags } = club
    const img = club.image_url || getDefaultClubImageURL()
    return (
      <Pop
        style={{ width: '100%' }}
        pose={hovering ? 'hovered' : 'idle'}
        onMouseEnter={() => this.setState({ hovering: true })}
        onMouseLeave={() => this.setState({ hovering: false })}>
        <Wrapper>
          <div className="columns is-vcentered is-gapless is-mobile">
            <div onClick={() => openModal(club)} className="column">
              <div className="columns is-gapless is-vcentered" style={{ padding: 10, width: '100%' }}>
                <div className="column is-narrow">
                  <Image src={img} />
                </div>
                <div className="column is-4" style={{ marginLeft: 20 }}>
                  <b className="is-size-6" style={{ color: CLUBS_GREY }}> {name} </b>
                  <div>
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
      </Pop>

    )
  }
}

export default ClubList
