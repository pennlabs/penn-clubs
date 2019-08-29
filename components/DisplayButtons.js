import React from 'react'
import s from 'styled-components'
import { MEDIUM_GRAY } from '../constants/colors'

const DisplayButtons = s.div`
  float: right;

  button {
    margin-left: 8px;
  }
`

const Icon = s.span`
  cursor: pointer;
  color: ${MEDIUM_GRAY};
`

export default ({ switchDisplay, shuffle }) => (
  <DisplayButtons>
    <button onClick={() => switchDisplay('cards')} className="button is-light is-small">
      <Icon className="icon">
        <i className="fas fa-th-large" title="Grid View" />
      </Icon>
    </button>
    <button onClick={() => switchDisplay('list')} className="button is-light is-small">
      <Icon className="icon">
        <i className="fas fa-list" title="List View" />
      </Icon>
    </button>
    <button
      onClick={shuffle}
      className="button is-light is-small">
      <Icon className="icon">
        <i className="fas fa-random" />
      </Icon>
      &nbsp;&nbsp;
      Shuffle
    </button>
  </DisplayButtons>
)
