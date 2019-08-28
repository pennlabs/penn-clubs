import React from 'react'
import s from 'styled-components'
import { CLUBS_GREY, CLUBS_GREY_LIGHT } from '../../constants/colors'
import { getDefaultClubImageURL, getSizeDisplay, EMPTY_DESCRIPTION } from '../../utils'
import { Link } from '../../routes'

import Details from './Details'
import Tags from './Tags'

const ModalWrapper = s.div`
  position: fixed;
  top: 0;
  height: 100%;
  width: 100%;
`

const ModalBackground = s.div`
  background-color: #d5d5d5;
  opacity: .5;
  position: fixed;
`

const ModalCard = s.div`
  margin: 6rem;
  border-radius: 3px;
  border-width: 1px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .1);
`

const CloseModalIcon = s.span`
  float: right;
  cursor: pointer;
  margin: 10px;
  color: ${CLUBS_GREY};
`

const FavoriteIcon = s.span`
  float: right;
  padding: 10px 10px 0 0;
  cursor: pointer;
  color: ${CLUBS_GREY};
`

const CardBody = s.div`
  padding: 20px 40px;
`

const CardHeader = s.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 5;
`

const CardTitle = s.strong`
  color: ${CLUBS_GREY};
`

const OverviewCol = s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 400px;
`

const ClubImage = s.img`
  max-height: 220px;
  max-width: 330px;
  border-radius: 3px;
  object-fit: contain;
  text-align: left;
`

const DescriptionCol = s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 400px;
`

const Description = s.div`
  height: 370px;
  overflow-y: auto;
  color: ${CLUBS_GREY_LIGHT};
  white-space: pre-wrap;
`

const SeeMoreButton = s.a`
  padding: 10px;
  margin: 5px;
  float: right;
  border-width: 0;
  background-color: #f2f2f2;
  color: ${CLUBS_GREY};
`

class ClubModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const {
      modal,
      club,
      closeModal,
      updateFavorites,
      favorite
    } = this.props
    const {
      name,
      id,
      tags,
      image_url,
      size,
      application_required,
      accepting_applications,
      description
    } = club

    return (
      <ModalWrapper
        className={`modal ${modal ? 'is-active' : ''}`}
        id="modal">
        <ModalBackground
          className="modal-background"
          onClick={() => closeModal(club)}
        />

        <ModalCard className="card">
          <CloseModalIcon className="icon" onClick={() => closeModal(club)}>
            <i className="fas fa-times"></i>
          </CloseModalIcon>

          <CardBody>
            <CardHeader style={{ paddingBottom: '1rem' }}>
              <CardTitle className="is-size-2">{name}</CardTitle>
              <FavoriteIcon className="icon" onClick={() => updateFavorites(id)}>
                {(favorite ? <p>Unfavourite</p> : <p>Favourite</p>)}
              </FavoriteIcon>
            </CardHeader>

            <div className="columns">
              <OverviewCol className="column is-4-desktop is-5-mobile">
                <ClubImage src={image_url || getDefaultClubImageURL()}/>

                <Tags tags={tags} />

                <Details
                  size={getSizeDisplay(size)}
                  application_required={application_required}
                  accepting_applications={accepting_applications}
                />
              </OverviewCol>

              <DescriptionCol className="column is-8-desktop is-7-mobile">
                <Description
                  className="has-text-justified is-size-6-desktop is-size-7-touch"
                  dangerouslySetInnerHTML={{ __html: description || EMPTY_DESCRIPTION }}
                />
                <Link route='club-view' params={{ club: String(id) }} passHref>
                  <SeeMoreButton className="button" target="_blank">
                    See More...
                  </SeeMoreButton>
                </Link>
              </DescriptionCol>
            </div>
          </CardBody>
        </ModalCard>
      </ModalWrapper>
    )
  }
}

export default ClubModal
