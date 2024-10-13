import styled from 'styled-components'

import {
  CLUBS_GREY,
  CLUBS_NAVY,
  MEDIUM_GRAY,
  WHITE,
} from '../../constants/colors'

export const Text = styled.p<{ $isGray?: boolean; color?: string }>`
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  ${({ $isGray }) => ($isGray ? `color: ${CLUBS_GREY};` : '')}
  ${({ color }) => (color ? `color: ${color};` : '')}
`

export const TextQuote = styled.span`
  display: block;
  margin-top: 12px;
  margin-bottom: 5px;
  padding: 5px;
  padding-left: 12px;
  border-left: 3px solid ${MEDIUM_GRAY};
  color: ${MEDIUM_GRAY};
  font-size: 1.2em;

  .notification.is-info & {
    color: white;
    border-left-color: white;
  }
`

export const SmallText = styled(Text)`
  font-size: 80%;
`
export const SmallLink = styled.a`
  font-size: 100%;
`

export const StrongText = styled(Text)`
  margin-bottom: 0.5rem;
  color: ${CLUBS_NAVY};
  font-weight: bold;
`

export const Title = styled.h1.attrs((props) => ({
  ...props,
  className: `title ${props.className ?? ''}`,
}))`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
`

export const Subtitle = styled.h2.attrs((props) => ({
  ...props,
  className: `subtitle ${props.className ?? ''}`,
}))`
  font-size: 1.5rem;
  font-weight: bold;
`

export const InfoPageTitle = styled(Title)`
  margin-top: 2rem;
  margin-bottom: 2rem;
`

export const Empty = styled(Text)`
  color: ${MEDIUM_GRAY};
`

export const Center = styled.div`
  text-align: center;
`
export const AlertText = styled.h1`
  font-size: 120%;
  font-weight: bold;
  marginleft: 3px;
  color: ${WHITE};
`

export const AlertDesc = styled.h1`
  font-size: 80%;
  color: ${WHITE};

  & a {
    color: ${WHITE};
  }
`
