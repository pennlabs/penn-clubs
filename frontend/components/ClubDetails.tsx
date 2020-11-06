import { ReactElement } from 'react'
import styled from 'styled-components'

import { CLUBS_GREY } from '../constants/colors'
import { Club } from '../types'
import { getSizeDisplay, isClubFieldShown } from '../utils'
import { BookmarkIcon, Icon, SubscribeIcon } from './common'

const Wrapper = styled.div`
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1.5px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  display: flex;
  justify-content: space-between;

  & > :not(:first-child) {
    margin-left: 5px;
  }
`

const iconStyles = {
  marginTop: '-5px',
  marginRight: '5px',
  opacity: 0.5,
  transform: 'translateY(3px)',
}

type DetailsProps = {
  club: Club
}

const DetailBoolIcon = ({ value, alt }): ReactElement => {
  return (
    <Icon
      name={value ? 'check-circle' : 'x-circle'}
      alt={alt}
      size="0.8rem"
      style={iconStyles}
    />
  )
}

const Details = ({ club }: DetailsProps): ReactElement => {
  const {
    size,
    application_required: applicationRequired,
    accepting_members: acceptingMembers,
    available_virtually: availableVirtually,
    appointment_needed: appointmentNeeded,
  } = club

  return (
    <Wrapper>
      <div
        style={{ color: CLUBS_GREY, fontSize: '80%', opacity: 0.8, flex: 1 }}
      >
        {isClubFieldShown('size') && (
          <>
            <Icon name="user" alt="members" size="0.8rem" style={iconStyles} />
            {getSizeDisplay(size, false)}
          </>
        )}
        {isClubFieldShown('available_virtually') && (
          <>
            <DetailBoolIcon
              value={availableVirtually}
              alt="available virtually"
            />
            {availableVirtually
              ? 'Available Virtually'
              : 'Not Available Virtually'}
          </>
        )}
        {isClubFieldShown('appointment_needed') && (
          <>
            &nbsp;
            {' • '}
            &nbsp;
            <DetailBoolIcon
              value={!appointmentNeeded}
              alt="appointment needed"
            />
            {appointmentNeeded ? 'Appointment Needed' : 'No Appointment Needed'}
          </>
        )}
        {isClubFieldShown('application_required') && (
          <>
            &nbsp;
            {' • '}
            &nbsp;
            <Icon
              name="edit"
              alt="applications"
              size="0.8rem"
              style={iconStyles}
            />
            {'Apps for '}
            {{
              1: 'No',
              2: 'Some',
              3: 'All',
            }[applicationRequired] || 'Unknown If'}
            {' Roles'}
          </>
        )}
        {isClubFieldShown('accepting_members') && (
          <>
            &nbsp;
            {' • '}
            &nbsp;
            <DetailBoolIcon value={acceptingMembers} alt="accepting members" />
            {acceptingMembers ? 'Taking Members' : 'Not Taking Members'}
          </>
        )}
      </div>
      <BookmarkIcon club={club} padding="0" />
      {club.enables_subscription && <SubscribeIcon club={club} padding="0" />}
    </Wrapper>
  )
}

export default Details
