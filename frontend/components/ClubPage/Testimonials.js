import s from 'styled-components'
import { useState, useEffect } from 'react'
import { StrongText, Icon } from '../common'
import { DARK_GRAY } from '../../constants/colors'

const Wrapper = s.span`
  display: inline-block;
  position: relative;
  width: 100%;

  svg {
    width: 25px;
    fill: #E1E2FF;
    stroke: #E1E2FF;
    stroke-width: none;
    stroke-linecap: square;
    stroke-linejoin: square;
    transform: rotate(90deg);
    position: absolute;
    bottom: 2.5rem;
    right: -0.5rem;
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
  width: 98%;
`

const Toggle = s.div`
  color: ${DARK_GRAY};
  cursor: pointer;
`

const FeatherTriangle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="feather feather-triangle"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
  </svg>
)

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

const Testimonials = props => {
  const { data: originalData } = props

  const [data, setData] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (originalData) {
      const newData = [...originalData]
      shuffleArray(newData)
      setData(newData)
    }
  }, [originalData])

  if (!data || !data.length) {
    return <></>
  }

  return (
    <>
      <StrongText>Member Experiences</StrongText>
      {expanded ? (
        data.map(({ text }, i) => (
          <Wrapper>
            <Quote key={i}>{text}</Quote>
            <FeatherTriangle />
          </Wrapper>
        ))
      ) : (
        <Wrapper>
          <Quote>{data[0].text}</Quote>
          <FeatherTriangle />
        </Wrapper>
      )}
      {data.length >= 2 && (
        <Toggle
          className="is-pulled-right"
          onClick={() => setExpanded(!expanded)}
        >
          See {expanded ? 'less' : 'more'}{' '}
          <Icon
            alt={expanded ? 'less' : 'more'}
            name={expanded ? 'chevron-up' : 'chevron-down'}
          />
        </Toggle>
      )}
    </>
  )
}

export default Testimonials
