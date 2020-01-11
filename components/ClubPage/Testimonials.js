import s from 'styled-components'
import { useState } from 'react'
import { StrongText, Icon } from '../common'
import { DARK_GRAY } from '../../constants/colors'

const Quote = s.div`
  padding: 15px;
  color: #4954F4;
  background-color: #E1E2FF;
  border-radius: 10px;
  margin-bottom: 1em;
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
        <Quote key={i}>{text}</Quote>
      )) : <Quote>{data[0].text}</Quote>}
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
