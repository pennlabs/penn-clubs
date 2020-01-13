import PropTypes from 'prop-types'
import s from 'styled-components'

import { Icon } from './Icon'

const SubscribeIconTag = s.span`
  cursor: pointer;
  padding: 10px 10px 0 0;
`

export const SubscribeIcon = ({
  updateSubscribes,
  club,
  subscribe,
}) => (
  <SubscribeIconTag>
    <Icon
      name={subscribe ? 'bell' : 'bell-off'}
      alt={subscribe ? 'Unsubscribe' : 'Subscribe'}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        updateSubscribes(club.code)
      }}
    />
  </SubscribeIconTag>
)

SubscribeIcon.propTypes = {
  updateSubscribes: PropTypes.func.isRequired,
  club: PropTypes.shape({
    code: PropTypes.string,
  }).isRequired,
  subscribe: PropTypes.bool,
}
