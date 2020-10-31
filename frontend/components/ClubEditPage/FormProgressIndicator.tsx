import React, { ReactElement } from 'react'
import s from 'styled-components'

import {
  PROGRESS_INDICATOR_PRIMARY,
  PROGRESS_INDICATOR_SECONDARY,
  PROGRESS_INDICATOR_SEP,
  PROGRESS_INDICATOR_TEXT,
} from '../../constants/colors'

type FormProgressIndicatorProps = {
  step: number
  steps: { name: string }[]
  onStepClick?: (step: number) => void
}

const StepBubbleContainer = s.span`
  text-align: center;
`

const StepText = s.span`
  color: ${PROGRESS_INDICATOR_SEP};
  font-size: 0.9em;
  line-height: 0.9em;
`

const StepBubble = s.div<{ passed: boolean }>`
  background-color: ${({ passed }) =>
    passed ? PROGRESS_INDICATOR_PRIMARY : PROGRESS_INDICATOR_SECONDARY};
  color: ${PROGRESS_INDICATOR_TEXT};
  width: 48px;
  height: 48px;
  font-size: 24px;
  text-align: center;
  line-height: 48px;
  border-radius: 24px;
  margin: 5px auto;
  cursor: ${({ passed }) => (passed ? 'pointer' : 'default')};
`

const StepArrow = s.span`
  border-top: 5px dotted ${PROGRESS_INDICATOR_SEP};
  margin-left: 10px;
  margin-right: 10px;
  width: 48px;
  margin-bottom: 1em;
`

const StepContainer = s.div`
  display: flex;
  justify-content: center;
  align-items: center;
`

const FormProgressIndicator = ({
  step,
  steps,
  onStepClick = () => undefined,
}: FormProgressIndicatorProps): ReactElement => {
  return (
    <StepContainer className="has-text-centered">
      {steps.map(({ name }, i) => (
        <React.Fragment key={i}>
          <StepBubbleContainer onClick={() => onStepClick(i)} key={i}>
            <StepBubble passed={i <= step}>{i + 1}</StepBubble>
            <StepText>{name}</StepText>
          </StepBubbleContainer>
          {i < steps.length - 1 && <StepArrow />}
        </React.Fragment>
      ))}
    </StepContainer>
  )
}

export default FormProgressIndicator
