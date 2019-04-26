import React from 'react'
import PropTypes from 'prop-types'
import posed from 'react-pose'
import {
  CLUBS_PURPLE,
  CLUBS_GREY,
  CLUBS_GREY_LIGHT,
} from '../colors'

const Pop = posed.div({
  idle: { scale: 1 },
  hovered: { scale: 1 },
})

const shorten = (desc) => {
  if (desc.length < 280) {
    return desc
  }

  return `${desc.slice(0, 280)}...`
}

const randomClub = () => {
  const clubs = [
    'https://files.slack.com/files-pri/T4EM1119V-FH9E8PE93/images.jpeg',
    'http://static.asiawebdirect.com/m/kl/portals/kuala-lumpur-ws/homepage/magazine/5-clubs/pagePropertiesImage/best-clubs-kuala-lumpur.jpg.jpg',
    'https://files.slack.com/files-pri/T4EM1119V-FHA7CVCNT/image.png',
    'https://files.slack.com/files-pri/T4EM1119V-FH920P727/image.png',
    'https://files.slack.com/files-pri/T4EM1119V-FH958BEAW/image.png',
    'https://files.slack.com/files-pri/T4EM1119V-FH6NHNE0Y/seltzer.jpg',
    'https://s3.envato.com/files/990f2541-adb3-497d-a92e-78e03ab34d9d/inline_image_preview.jpg',
  ]
  const i = Math.floor(Math.random() * (6))
  return clubs[i]
}

class ClubCard extends React.Component {
  constructor (props) {
    super(props)

    const { club } = props
    const clubImg = club.img ? club.img : randomClub()

    this.state = {
      hovering: false,
      clubImg,
    }
  }

  findTagById (id) {
    const { tags } = this.props
    return tags.find(tag => tag.id === id).name
  }

  render () {
    const {
      club,
      openModal,
      updateFavorites,
      favorite,
    } = this.props

    const {
      name,
      id,
      subtitle,
      tags,
    } = club

    const {
      clubImg,
      hovering,
    } = this.state

    return (
      <div className="column is-half-desktop">
        <Pop
          pose={hovering ? 'hovered' : 'idle'}
          onMouseEnter={() => this.setState({ hovering: true })}
          onMouseLeave={() => this.setState({ hovering: false })}
        >
          <div
            className="card is-flex"
            style={{
              padding: 10,
              borderRadius: 3,
              minHeight: 240,
              boxShadow: '0 0 0 #fff',
              border: '1px solid #e5e5e5',
              backgroundColor: hovering ? '#FAFAFA' : '#fff',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => openModal(club)}
              onKeyPress={() => openModal(club)}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  margin: '0 3px',
                }}
              >
                <b className="is-size-5" style={{ color: CLUBS_GREY }}>
                  {' '}
                  {name}
                  {' '}
                </b>
              </div>
              {tags.map(tag => (
                <span
                  className="tag is-rounded has-text-white"
                  style={{
                    backgroundColor: CLUBS_PURPLE,
                    margin: 2,
                    fontSize: '.5em',
                  }}
                >
                  {this.findTagById(tag)}
                </span>
              ))}
              <div className="columns is-desktop is-gapless" style={{ padding: '10px 5px' }}>
                <div className="column is-narrow">
                  <img
                    style={{ height: 120, width: 180, borderRadius: 3 }}
                    src={clubImg}
                    alt={`Logo of ${name}`}
                  />
                </div>
                <div className="column">
                  <p
                    style={{
                      fontSize: '.8em',
                      paddingLeft: 8,
                      color: CLUBS_GREY_LIGHT,
                    }}
                  >
                    {shorten(subtitle)}
                  </p>
                </div>
              </div>
            </div>
            <span
              className="icon"
              onClick={() => updateFavorites(id)}
              onKeyPress={() => updateFavorites(id)}
              role="button"
              tabIndex={0}
              style={{
                color: CLUBS_GREY,
                float: 'right',
                padding: '10px 10px 0px 0px',
                cursor: 'pointer',
              }}
            >
              <i className={`${favorite ? 'fas' : 'far'} fa-heart`} />
            </span>
          </div>
        </Pop>
      </div>
    )
  }
}

ClubCard.propTypes = {
  club: PropTypes.shape({}).isRequired,
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  openModal: PropTypes.func.isRequired,
  updateFavorites: PropTypes.func.isRequired,
  favorite: PropTypes.bool.isRequired,
}

export default ClubCard
