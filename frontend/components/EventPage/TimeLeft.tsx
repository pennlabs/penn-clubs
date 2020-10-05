
import { ReactElement } from 'react'
import styled from 'styled-components'
import TimeAgo  from 'react-timeago';

import { LIGHT_GRAY } from '../../constants'

const TimeLeft = ({
    start,
    className,
  }: {
    start: Date
    className?: string
  }): ReactElement => (
    <TimeAgo className ={className} date={start}/>
  )
  
  export default styled(TimeLeft)`
  color: ${LIGHT_GRAY};
  font-size: 12px;
  `