import Link from 'next/link'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { mediaMaxWidth, PHONE } from '../constants'
import {
  ALLBIRDS_GRAY,
  BLACK_ALPHA,
  WHITE,
  WHITE_ALPHA,
} from '../constants/colors'
import { BODY_FONT } from '../constants/styles'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../utils/branding'
import { Icon } from './common'

const DisplayButtonsTag = styled.div`
  float: right;
  font-family: ${BODY_FONT};

  .button {
    margin-left: 8px;
  }

  ${mediaMaxWidth(PHONE)} {
    float: none;
    text-align: right;
    margin-bottom: 1rem;
  }
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
}: DisplayButtonsProps): ReactElement => (
  <DisplayButtonsTag>
    <button
      onClick={() => switchDisplay('cards')}
      className="button is-small"
      style={buttonStyles}
      aria-label="switch to grid view"
    >
      <Icon name="grid" alt="grid icon" style={iconStyles} />
    </button>
    <button
      onClick={() => switchDisplay('list')}
      className="button is-small"
      style={buttonStyles}
      aria-label="switch to list view"
    >
      <Icon name="list" alt="list icon" style={iconStyles} />
    </button>
    <Link href="/create">
      <a className="button is-small is-primary">
        <Icon
          name="plus"
          alt={`create ${OBJECT_NAME_SINGULAR}`}
          style={iconStylesDark}
        />
        Add {OBJECT_NAME_TITLE_SINGULAR}
      </a>
    </Link>
  </DisplayButtonsTag>
)

type DisplayButtonsProps = {
  switchDisplay: (disp: 'list' | 'cards') => void
}

export default DisplayButtons
