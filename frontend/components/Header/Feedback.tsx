import { ReactElement } from 'react'
import styled from 'styled-components'

import { FEEDBACK_BG } from '../../constants/colors'
import { ANIMATION_DURATION } from '../../constants/measurements'
import { logEvent } from '../../utils/analytics'
import { FEEDBACK_URL } from '../../utils/branding'
import { Icon } from '../common'

const DIAMETER = '3rem'
const ICON_SIZE = '1.5rem'
const OFFSET = '18px'

const FeedbackLink = styled.a`
  display: inline-block;
  width: ${DIAMETER};
  height: ${DIAMETER};
  border-radius: 3rem;
  background-color: ${FEEDBACK_BG};
  position: fixed;
  bottom: ${OFFSET};
  right: ${OFFSET};
  text-align: center;
  box-shadow: 0 2px 8px rgba(25, 89, 130, .4);
  cursor: pointer;
  z-index: 10;
  transition: background-color ${ANIMATION_DURATION}ms ease;

  &:hover {
    background-color: ${FEEDBACK_BG};
  }
`

const Feedback = (): ReactElement => (
  <FeedbackLink
    href={FEEDBACK_URL}
    title="Feedback"
    target="_blank"
    onClick={() => logEvent('feedback', 'clicked')}
  >
    <Icon
      name="message-circle"
      alt="Feedback"
      size={ICON_SIZE}
      style={{ marginTop: '0.75rem', color: 'white' }}
    />
  </FeedbackLink>
)

export default Feedback
