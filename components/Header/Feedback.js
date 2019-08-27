import React from 'react'
import s from 'styled-components'

// TODO style this better
const FeedbackLink = s.a`
  display: inline-block;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 3rem;
  background-color: white;
  position: fixed;
  bottom: 20px;
  right: 20px;
  textAlign: center;
  boxShadow: 0 0 7px #ccc;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background-color: #ddd;
  }
`

export default () => (
  <FeedbackLink
    href="https://airtable.com/shrCsYFWxCwfwE7cf"
    title="Feedback"
    target="_blank">
    <i className={'fa-comment'} style={{
      fontSize: '1.2em',
      color: '#6a6a6a',
      lineHeight: '2.5rem'
    }} />
  </FeedbackLink>
)
