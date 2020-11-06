import { ReactElement } from 'react'
import styled, { css, keyframes } from 'styled-components'

import { RED } from '../../constants/colors'

const blink = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`

const HappeningNow = (): ReactElement => <p>HAPPENING NOW</p>

const UrgentText = css`
  color: ${RED};

  &:after {
    animation: ${blink} 1.5s infinite;
    content: ' \\25CF';
    color: ${RED};
  }
`

export default styled(HappeningNow)<{ urgent?: boolean; floatRight?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  ${({ floatRight }) => (floatRight ? 'float: right;' : '')}
  ${({ urgent }) => (urgent ? UrgentText : '')}
`
