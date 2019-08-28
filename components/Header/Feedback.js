import React from 'react'
import s from 'styled-components'

const DIAMETER = '3rem'
const OFFSET = '18px'

// TODO style this better
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
    background-color: #efefef;
  }
`

export default () => (
  <FeedbackLink
    href="https://airtable.com/shrCsYFWxCwfwE7cf"
    title="Feedback"
    target="_blank">
    <i className={'fa-comment far'} style={{
      fontSize: '1.2em',
      color: '#6a6a6a',
      lineHeight: DIAMETER
    }} />
  </FeedbackLink>
)
