import Color from 'color'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { FEEDBACK_BG } from '../../constants/colors'
import { ANIMATION_DURATION } from '../../constants/measurements'
import { logEvent } from '../../utils/analytics'
import { FEEDBACK_URL } from '../../utils/branding'
import { Icon } from '../common'

const DIAMETER = '3rem'
const ICON_SIZE = '1.5rem'
const OFFSET = 18

interface LinkProps {
  $offsetAddition: number
}

export const ActionLink = styled.a<LinkProps>`
  display: inline-block;
  width: ${DIAMETER};
  height: ${DIAMETER};
  border-radius: 3rem;
  background-color: ${FEEDBACK_BG};
  position: fixed;
  bottom: ${(props) => props.$offsetAddition + OFFSET}px;
  right: ${OFFSET}px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(25, 89, 130, 0.4);
  cursor: pointer;
  z-index: 10;
  transition: background-color ${ANIMATION_DURATION} ease;

  &:hover {
    background-color: ${Color(FEEDBACK_BG).lighten(0.1).string()};
  }

  & svg {
    margin-top: 0.75rem;
    color: white;
  }
`

const Feedback = (): ReactElement<any> => (
  <ActionLink
    $offsetAddition={0}
    rel="noopener noreferrer"
    href={FEEDBACK_URL}
    title="Feedback"
    target="_blank"
    onClick={() => logEvent('feedback', 'clicked')}
  >
    <Icon name="feedback" alt="Feedback" size={ICON_SIZE} />
  </ActionLink>
)

export default Feedback
