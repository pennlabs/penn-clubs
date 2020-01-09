import s from 'styled-components'
import PropTypes from 'prop-types'

import { Icon } from './common'
import { DARK_GRAY, ALLBIRDS_GRAY, WHITE } from '../constants/colors'

const DisplayButtonsTag = s.div`
  float: right;

  button {
    margin-left: 8px;
  }
`

const iconStyles = {
  transform: 'translateY(0px)',
  opacity: 0.6,
}

const buttonStyles = {
  backgroundColor: `${WHITE}`,
  border: `1px solid ${ALLBIRDS_GRAY}`,
}

const DisplayButtons = ({ switchDisplay, shuffle }) => (
  <DisplayButtonsTag>
    <button
      onClick={() => switchDisplay('cards')}
      className="button is-small"
      style={buttonStyles}
    >
      <Icon name="grid" alt="switch to grid view" style={iconStyles} />
    </button>
    <button
      onClick={() => switchDisplay('list')}
      className="button is-small"
      style={buttonStyles}
    >
      <Icon name="list" alt="switch to list view" style={iconStyles} />
    </button>
    <button
      onClick={shuffle}
      style={{ color: DARK_GRAY, fontWeight: 600 }}
      className="button is-small"
      style={buttonStyles}
    >
      <Icon name="shuffle" alt="shuffle club order" style={iconStyles} />
      &nbsp;&nbsp; Shuffle
    </button>
  </DisplayButtonsTag>
)

DisplayButtons.propTypes = {
  switchDisplay: PropTypes.func.isRequired,
  shuffle: PropTypes.func.isRequired,
}

export default DisplayButtons
