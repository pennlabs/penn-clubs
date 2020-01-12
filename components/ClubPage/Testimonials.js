import s from 'styled-components'
import { useState } from 'react'
import { StrongText, Icon } from '../common'
import { DARK_GRAY } from '../../constants/colors'

const Wrapper = s.span`
  display: inline-block;

  svg {
    width: 10%;
    fill: #E1E2FF;
    stroke: #E1E2FF;
    stroke-width: none;
    stroke-linecap: square;
    stroke-linejoin: square;
    transform: rotate(90deg);
    margin-top: -3.5rem;
    float: right;
  }
`

const Quote = s.div`
  float: left;
  padding: 1rem;
  color: #4954F4;
  background-color: #E1E2FF;
  border-radius: 10px;
  margin-bottom: 1em;
  margin-right: -1rem;
  width: 95%;
`

const Toggle = s.div`
  color: ${DARK_GRAY};
  cursor: pointer;
`

const Testimonials = props => {
  const { data } = props

  const [expanded, setExpanded] = useState(false)

  if (!data || !data.length) {
    return <></>
  }

  return (
    <>
      <StrongText>Member Experiences</StrongText>
      {expanded ? data.map(({ text }, i) => (
        <Wrapper>
          <Quote key={i}>{text}</Quote>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="feather feather-triangle">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          </svg>
        </Wrapper>
      )) : <Wrapper>
        <Quote>{data[0].text}</Quote>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          class="feather feather-triangle">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        </svg>
      </Wrapper>}
      <Toggle className="is-pulled-right" onClick={() => setExpanded(!expanded)}>
        See {expanded ? 'less' : 'more'}{' '}
        <Icon
          alt={expanded ? 'less' : 'more'}
          name={expanded ? 'chevron-up' : 'chevron-down'}
        />
      </Toggle>
    </>
  )
}

export default Testimonials
