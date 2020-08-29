import { ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import { DARK_GRAY } from '../../constants/colors'
import { Testimonial } from '../../types'
import { Icon, StrongText } from '../common'

const Wrapper = s.span`
  display: inline-block;
  position: relative;
  width: 100%;

  img {
    width: 25px;
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

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

type TestimonialsProps = {
  data: [Testimonial]
}

const Testimonials = (props: TestimonialsProps): ReactElement | null => {
  const { data: originalData } = props

  const [data, setData] = useState<Testimonial[] | null>(null)
  const [expanded, setExpanded] = useState<boolean>(false)

  useEffect(() => {
    if (originalData) {
      const newData = [...originalData]
      shuffleArray<Testimonial>(newData)
      setData(newData)
    }
  }, [originalData])

  if (!data || !data.length) {
    return null
  }

  return (
    <div className="is-clearfix">
      <StrongText>Member Experiences</StrongText>
      {expanded ? (
        data.map(({ text }, i) => (
          <Wrapper key={i}>
            <Quote>{text}</Quote>
            <Icon name="triangle-testimonial" />
          </Wrapper>
        ))
      ) : (
        <Wrapper>
          <Quote>{data[0].text}</Quote>
          <Icon name="triangle-testimonial" />
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
    </div>
  )
}

export default Testimonials
