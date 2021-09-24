import { ReactElement, useContext, useState } from 'react'
import styled from 'styled-components'

import { BLACK, MEDIUM_GRAY } from '../../constants/colors'
import { Club } from '../../types'
import { apiSetSubscribeStatus } from '../../utils'
import { AuthCheckContext } from '../contexts'

const SubscribeIconTag = styled.span<{
  padding?: string
  absolute?: boolean
  subscribe?: boolean
}>`
  float: right;
  padding: ${({ padding }) => padding || '7px 0 0 0'};
  cursor: pointer;

  ${({ absolute }) =>
    absolute &&
    `
    float: none;
    position: absolute;
    right: 0;
  `}

  svg {
    height: 1rem;
    width: 1rem;
    fill: ${({ subscribe }) => (subscribe ? BLACK : 'none')};
    stroke: ${({ subscribe }) => (subscribe ? BLACK : MEDIUM_GRAY)};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;

    &:hover {
      fill: ${({ subscribe }) => (subscribe ? BLACK : MEDIUM_GRAY)};
    }
  }
`

type SubscribeIconProps = {
  club: Club
  absolute?: boolean
  padding?: string
  onSubscribe?: (status: boolean) => void
}

export const SubscribeIcon = ({
  club,
  absolute = false,
  padding,
  onSubscribe = () => null,
}: SubscribeIconProps): ReactElement => {
  const [subscribe, setSubscribe] = useState<boolean>(club.is_subscribe)
  const authCheck = useContext(AuthCheckContext)

  const updateSubscribe = () => {
    authCheck(() => {
      apiSetSubscribeStatus(club.code, !subscribe).then(() => {
        setSubscribe(!subscribe)
        onSubscribe(!subscribe)
      })
    })
  }

  return (
    <SubscribeIconTag
      subscribe={subscribe}
      absolute={absolute}
      padding={padding}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        updateSubscribe()
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="feather feather-bell"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    </SubscribeIconTag>
  )
}
