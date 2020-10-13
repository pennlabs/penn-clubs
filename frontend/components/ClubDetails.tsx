import { ReactElement } from 'react'
import s from 'styled-components'

import { CLUBS_GREY } from '../constants/colors'
import { Club } from '../types'
import { getSizeDisplay } from '../utils'
import { BookmarkIcon, Icon, SubscribeIcon } from './common'

const Wrapper = s.div`
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

const Details = ({ club }: DetailsProps): ReactElement => {
  const {
    size,
    membership_count: membershipCount,
    application_required: applicationRequired,
    accepting_members: acceptingMembers,
  } = club

  return (
    <Wrapper>
      <div
        style={{ color: CLUBS_GREY, fontSize: '80%', opacity: 0.8, flex: 1 }}
      >
        <Icon name="user" alt="members" size="0.8rem" style={iconStyles} />
        {membershipCount > 0
          ? `${membershipCount}`
          : getSizeDisplay(size, false)}
        &nbsp;
        {' • '}
        &nbsp;
        <Icon name="edit" alt="applications" size="0.8rem" style={iconStyles} />
        {'Apps for '}
        {{
          1: 'No',
          2: 'Some',
          3: 'All',
        }[applicationRequired] || 'Unknown If'}
        {' Roles'}
        &nbsp;
        {' • '}
        &nbsp;
        {acceptingMembers ? (
          <Icon
            name="check-circle"
            alt="accepting members"
            size="0.8rem"
            style={iconStyles}
          />
        ) : (
          <Icon
            name="x-circle"
            alt="accepting members"
            size="0.8rem"
            style={iconStyles}
          />
        )}
        {acceptingMembers ? 'Taking Members' : 'Not Taking Members'}
      </div>
      <BookmarkIcon club={club} padding="0" />
      {club.enables_subscription && <SubscribeIcon club={club} padding="0" />}
    </Wrapper>
  )
}

export default Details
