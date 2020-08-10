import Link from 'next/link'
import { ReactElement } from 'react'
import s from 'styled-components'

import {
  ALLBIRDS_GRAY,
  BLACK_ALPHA,
  CLUBS_BLUE,
  DARK_GRAY,
  WHITE,
  WHITE_ALPHA,
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
  background-color: ${CLUBS_BLUE};
  color: ${WHITE_ALPHA(0.8)} !important;
`

const iconStyles = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${BLACK_ALPHA(0.8)} !important`,
}

const iconStylesDark = {
  transform: 'translateY(0px)',
  opacity: 0.6,
  color: `${WHITE_ALPHA(0.8)} !important`,
}

const buttonStyles = {
  backgroundColor: WHITE,
  border: `1px solid ${ALLBIRDS_GRAY}`,
  fontFamily: BODY_FONT,
}

const DisplayButtons = ({
  switchDisplay,
  switchSort,
  shuffle,
}: DisplayButtonsProps): ReactElement => (
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
      style={{ ...buttonStyles, color: DARK_GRAY, fontWeight: 600 }}
      className="button is-small"
    >
      <Icon name="shuffle" alt="shuffle club order" style={iconStyles} />
      &nbsp;&nbsp; Shuffle
    </button>
    <button
      onClick={switchSort}
      style={{ ...buttonStyles, color: DARK_GRAY, fontWeight: 600 }}
      className="button is-small"
    >
      <Icon name="filter" alt="shuffle club order" style={iconStyles} />
      &nbsp;&nbsp; Reorder
    </button>
    <Link href="/create">
      <AddClubButton className="button is-small">
        <Icon name="plus" alt="create club" style={iconStylesDark} />
        Add Club
      </AddClubButton>
    </Link>
  </DisplayButtonsTag>
)

type DisplayButtonsProps = {
  switchDisplay: (disp: string) => void
  switchSort: () => void
  shuffle: () => void
}

export default DisplayButtons
