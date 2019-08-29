import React from 'react'
import s from 'styled-components'
import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, MEDIUM_GRAY, LIGHT_GRAY, ALLBIRDS_GRAY,
  LIGHTER_BLUE, DARK_BLUE, BABY_BLUE
} from '../../constants/colors'
import { BORDER_RADIUS_LG, mediaMaxWidth, MD, SM } from '../../constants/measurements'
import { getDefaultClubImageURL, getSizeDisplay, EMPTY_DESCRIPTION } from '../../utils'
import { Link } from '../../routes'
import TagGroup from '../common/TagGroup'
import FavoriteIcon from '../common/FavoriteIcon'

import Details from './Details'

const ModalWrapper = s.div`
  position: fixed;
  top: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  z-index: 1001;

  ${mediaMaxWidth(MD)} {
    &.is-active {
      display: block !important;
    }
  }
`

const ModalBackground = s.div`
  background-color: ${ALLBIRDS_GRAY};
  opacity: .5;
  position: fixed;
`

const ModalCard = s.div`
  margin: 1rem 20% 1rem 20%;
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;

  ${mediaMaxWidth(MD)} {
    margin: 1rem 15%;
  }

  ${mediaMaxWidth(SM)} {
    margin: 1rem;
  }
`

const CloseModalIcon = s.span`
  float: right;
  cursor: pointer;
  margin: 10px;
  color: ${LIGHT_GRAY};

  &:hover {
    color: ${MEDIUM_GRAY};
  }
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
  line-height: 1;
`

const OverviewCol = s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: min-400px;
`

const ClubImage = s.img`
  max-height: 220px;
  max-width: 100%;
  object-fit: contain;
`

const ClubImageWrapper = s.div`
  text-align: center;
  flex: 1;
`

const DescriptionCol = s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: min-400px;
`

const Description = s.div`
  overflow-y: auto;
  color: ${CLUBS_GREY_LIGHT};
  white-space: pre-wrap;
  margin-bottom: 1rem;
`

const SeeMoreButton = s.a`
  padding: 10px;
  float: right;
  border-width: 0;
  background-color: ${BABY_BLUE};
  font-weight: 600;
  color: ${DARK_BLUE} !important;

  &:hover {
    background-color: ${LIGHTER_BLUE};
  }
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
      accepting_members,
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
              <FavoriteIcon club={club} favorite={favorite} updateFavorites={updateFavorites} />
            </CardHeader>

            <div className="columns">
              <OverviewCol className="column is-4-desktop is-12-mobile">
                <ClubImageWrapper>
                  <ClubImage src={image_url || getDefaultClubImageURL()}/>
                </ClubImageWrapper>

                <div>
                  <TagGroup tags={tags} />
                </div>

                <Details
                  size={getSizeDisplay(size)}
                  application_required={application_required}
                  accepting_members={accepting_members}
                />
              </OverviewCol>

              <DescriptionCol className="column is-8-desktop is-12-mobile">
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
