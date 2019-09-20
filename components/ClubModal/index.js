import React from 'react'
import s from 'styled-components'

import {
  CLUBS_GREY, CLUBS_GREY_LIGHT, MEDIUM_GRAY, LIGHT_GRAY, ALLBIRDS_GRAY,
  LIGHTER_BLUE, DARK_BLUE, BABY_BLUE, WHITE
} from '../../constants/colors'
import { BORDER_RADIUS_LG, mediaMaxWidth, MD, SM } from '../../constants/measurements'
import { getDefaultClubImageURL, getSizeDisplay, EMPTY_DESCRIPTION } from '../../utils'
import { Link } from '../../routes'
import TagGroup from '../common/TagGroup'
import FavoriteButton from './FavoriteButton'

import Details from './Details'

const ModalWrapper = s.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1002;

  padding: 1rem 12%;

  ${mediaMaxWidth(MD)} {
    padding: 1rem 6%;
  }

  ${mediaMaxWidth(SM)} {
    padding: 1rem;
  }

  ${mediaMaxWidth(MD)} {
    &.is-active {
      display: block !important;
    }
  }
`

const ModalBackground = s.div`
  background-color: ${ALLBIRDS_GRAY};
  opacity: .75;
  position: fixed;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
`

const ModalCard = s.div`
  border-radius: ${BORDER_RADIUS_LG};
  border: 0 !important;
  box-shadow: none !important;
  height: auto;
  width: 100%;

  ${mediaMaxWidth(SM)} {
    max-height: calc(100vh - 2rem);
    overflow: hidden;
    padding-bottom: 140px;
  }
`

const CloseModalIcon = s.span`
  position: absolute;
  right: 10px;
  top: 10px;
  cursor: pointer;
  color: ${LIGHT_GRAY};

  &:hover {
    color: ${MEDIUM_GRAY};
  }
`

const CardBody = s.div`
  padding: 20px 40px;

  ${mediaMaxWidth(MD)} {
    padding: 20px;
  }

  ${mediaMaxWidth(SM)} {
    padding: 1rem;
    overflow: hidden;
  }
`

const CardHeader = s.div`
  display: block;
  padding-bottom: 2rem;
`

const CardTitle = s.strong`
  color: ${CLUBS_GREY};
  line-height: 1;
`

const OverviewCol = s.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const ClubImage = s.img`
  max-height: 220px;
  max-width: 80%;
  object-fit: contain;
  padding-bottom: 2rem;

  ${mediaMaxWidth(SM)} {
    margin-bottom: 1rem;
  }
`

const ClubImageWrapper = s.div`
  text-align: center;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  ${mediaMaxWidth(SM)} {
    width: 100%;
    padding: 0 1rem;
  }
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
  line-height: 1;

  &:hover {
    background-color: ${LIGHTER_BLUE};
  }
`

const ButtonWrapper = s.div`
  width: 100%;
  background: ${WHITE};
  border-radius: 0 0 ${BORDER_RADIUS_LG} ${BORDER_RADIUS_LG};

  .button {
    width: 100%;
    display: block;
  }

  ${mediaMaxWidth(SM)} {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0 1rem 1rem 1rem;
  }
`

const ButtonWrapperGradient = s.div`
  display: none;

  ${mediaMaxWidth(SM)} {
    position: absolute;
    bottom: 96px;
    left: 0;
    display: block;
    width: 100%;
    height: 1.5rem;
    background-image: linear-gradient(rgba(255, 255, 255, 0), ${WHITE});
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
      code,
      tags,
      image_url: imageUrl,
      size,
      application_required: appRequired,
      accepting_members: acceptingMembers,
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
            <CardHeader>
              <CardTitle className="is-size-2-tablet is-size-3-mobile">{name}</CardTitle>
            </CardHeader>

            <div className="columns">
              <OverviewCol className="column is-4-desktop is-12-mobile">
                <ClubImageWrapper>
                  <ClubImage src={imageUrl || getDefaultClubImageURL()}/>
                </ClubImageWrapper>

                <div>
                  <TagGroup tags={tags} />
                </div>

                <Details
                  size={getSizeDisplay(size)}
                  applicationRequired={appRequired}
                  acceptingMembers={acceptingMembers}
                />
              </OverviewCol>

              <DescriptionCol className="column is-8-desktop is-12-mobile">
                <Description
                  className="is-size-6-desktop is-size-7-touch is-size-5-mobile"
                  dangerouslySetInnerHTML={{ __html: description || EMPTY_DESCRIPTION }}
                />

                <ButtonWrapperGradient />

                <ButtonWrapper>
                  <FavoriteButton
                    club={club}
                    favorite={favorite}
                    updateFavorites={updateFavorites}
                  />
                  <Link route='club-view' params={{ club: String(code) }} passHref>
                    <SeeMoreButton className="button" target="_blank">
                      See More...
                    </SeeMoreButton>
                  </Link>
                </ButtonWrapper>
              </DescriptionCol>
            </div>
          </CardBody>
        </ModalCard>
      </ModalWrapper>
    )
  }
}

export default ClubModal
