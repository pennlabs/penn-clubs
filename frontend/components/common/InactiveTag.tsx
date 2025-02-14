import { ReactElement } from 'react'
import styled from 'styled-components'

import { BLACK_ALPHA, DARK_GRAY } from '../../constants/colors'

const Span = styled.span`
  display: inline-block;
  margin-left: 0.5rem;
  font-size: 1rem;
  background: ${BLACK_ALPHA(0.05)};
  color: ${DARK_GRAY};
  opacity: 0.8;
  padding: 0.25rem 0.5rem;
  transform: translateY(-0.25rem);
  border-radius: 0.2rem;
  font-weight: 500;
`

export const InactiveTag = (): ReactElement<any> => <Span>Inactive</Span>
