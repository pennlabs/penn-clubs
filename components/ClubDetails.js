import PropTypes from 'prop-types'
import s from 'styled-components'

import { CLUBS_GREY } from '../constants/colors'
import { getSizeDisplay } from '../utils'
import { Icon } from './common'

const Wrapper = s.div`
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1.5px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  display: flex;
  justify-content: space-between;
`

const iconStyles = {
  marginRight: '5px',
  opacity: 0.5,
  transform: 'translateY(3px)',
}

const Details = ({ size, applicationRequired, acceptingMembers }) => (
  <Wrapper>
    <p style={{ color: CLUBS_GREY, fontSize: '80%', opacity: 0.8 }}>
      <Icon name="user" alt="members" style={iconStyles} />
      {getSizeDisplay(size, false)}
      &nbsp;
      {' • '}
      &nbsp;
      <Icon name="edit" alt="applications" style={iconStyles} />
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
        <Icon name="check-circle" alt="accepting members" style={iconStyles} />
      ) : (
        <Icon name="x-circle" alt="accepting members" style={iconStyles} />
      )}
      {acceptingMembers ? 'Taking Members' : 'Not Taking Members'}
    </p>
  </Wrapper>
)

Details.defaultProps = {
  applicationRequired: null,
  acceptingMembers: false,
}

Details.propTypes = {
  size: PropTypes.number.isRequired,
  applicationRequired: PropTypes.number,
  acceptingMembers: PropTypes.bool,
}

export default Details
