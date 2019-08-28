import React from 'react'
import s from 'styled-components'

import {logEvent} from '../../utils/analytics'

import { HOVER_GRAY, MEDIUM_GRAY } from '../../constants/colors'

const DIAMETER = '3rem'
const OFFSET = '18px'

const FeedbackLink = s.a`
  display: inline-block;
  width: ${DIAMETER};
  height: ${DIAMETER};
  border-radius: 3rem;
  background-color: white;
  position: fixed;
  bottom: ${OFFSET};
  right: ${OFFSET};
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .2);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${HOVER_GRAY};
  }
`

const Icon = s.i`
  fontSize: 24px;
  color: ${MEDIUM_GRAY};
  line-height: ${DIAMETER};
`

export default () => (
  <FeedbackLink
    href="https://airtable.com/shrCsYFWxCwfwE7cf"
    title="Feedback"
    target="_blank"
    onClick={() => logEvent('feedback', 'clicked')}>
    <Icon className="fa-comment far fa-lg" />
  </FeedbackLink>
)
