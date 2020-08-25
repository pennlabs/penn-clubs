import styled from 'styled-components'

import { CLUBS_BLUE, CLUBS_GREY, MEDIUM_GRAY } from '../../constants'

export const ClubName = styled.p`
  font-size: 21px;
  font-weight: bold;
  color: ${CLUBS_GREY};
  margin-top: 0.5rem;
`

export const EventName = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: ${MEDIUM_GRAY};
`

export const EventLink = styled.a`
  color: ${CLUBS_BLUE};
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.07px;
  &:hover {
    text-decoration: underline;
    color: ${CLUBS_BLUE};
  }
  white-space: nowrap;
  width: 100%;
  text-overflow: ellipsis;
`
