import PropTypes from 'prop-types'
import s from 'styled-components'

import { CLUBS_GREY } from '../constants/colors'

const Wrapper = s.div`
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1.5px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  display: flex;
  justify-content: space-between;
`

// TODO add icons

const Details = ({ size, applicationRequired, acceptingMembers }) => (
  <Wrapper>
    <p style={{ color: CLUBS_GREY, fontSize: '80%' }}>
      {size}
      {' members'}
      &nbsp;
      {' • '}
      &nbsp;
      {{
        1: 'No',
        2: 'Some',
        3: 'All',
      }[applicationRequired] || 'unknown'}
      {' apps required'}
      &nbsp;
      {' • '}
      &nbsp;
      {acceptingMembers ? 'Accepting members' : 'Not accepting members'}
    </p>
  </Wrapper>
)

Details.defaultProps = {
  applicationRequired: null,
  acceptingMembers: false,
}

Details.propTypes = {
  size: PropTypes.string.isRequired,
  applicationRequired: PropTypes.number,
  acceptingMembers: PropTypes.bool,
}

export default Details
