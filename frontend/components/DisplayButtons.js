import Link from 'next/link'
import PropTypes from 'prop-types'
import s from 'styled-components'

import { Icon } from './common'
import {
  DARK_GRAY,
  ALLBIRDS_GRAY,
  WHITE,
  WHITE_ALPHA,
  CLUBS_RED,
} from '../constants/colors'
import { BODY_FONT } from '../constants/styles'
import { Icon } from './common'

const DisplayButtonsTag = s.div`
  float: right;
  font-family: ${BODY_FONT};

  .button {
    margin-left: 8px;
  }
`

const AddClubButton = s.a`
  background-color: ${CLUBS_RED};
  color: ${WHITE_ALPHA(0.8)} !important;
`

const iconStyles = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${WHITE_ALPHA(0.8)} !important`,
}

const buttonStyles = {
  backgroundColor: WHITE,
  border: `1px solid ${ALLBIRDS_GRAY}`,
  fontFamily: BODY_FONT,
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
    <Link href="/create">
      <AddClubButton className="button is-small">
        <Icon name="plus" alt="create club" style={iconStyles} />
        Add Club
      </AddClubButton>
    </Link>
  </DisplayButtonsTag>
)

DisplayButtons.propTypes = {
  switchDisplay: PropTypes.func.isRequired,
  shuffle: PropTypes.func.isRequired,
}

export default DisplayButtons
