import { ReactElement, useContext, useState } from 'react'
import styled from 'styled-components'

import { BLACK, MEDIUM_GRAY } from '../../constants/colors'
import { Club } from '../../types'
import { apiSetFavoriteStatus } from '../../utils'
import { AuthCheckContext } from '../contexts'

type BookmarkIconTagProps = {
  $padding?: string
  $absolute?: boolean
  $favorite?: boolean
}

const BookmarkIconTag = styled.span<BookmarkIconTagProps>`
  padding: ${({ $padding }) => $padding || '15px 10px 0 0'};
  cursor: pointer;

  ${({ $absolute }) =>
    $absolute &&
    `
    float: none;
    position: absolute;
    right: 0;

  `}

  svg {
    height: 1rem;
    width: 1rem;
    fill: ${({ $favorite }) => ($favorite ? BLACK : 'none')};
    stroke: ${({ $favorite }) => ($favorite ? BLACK : MEDIUM_GRAY)};
    stroke-width: 2px;
    stroke-linecap: round;
    stroke-linejoin: round;

    &:hover {
      fill: ${({ $favorite }) => ($favorite ? BLACK : MEDIUM_GRAY)};
    }
  }
`

export const BookmarkIcon = ({
  club,
  absolute = false,
  padding,
  onFavorite = () => null,
}: Props): ReactElement<any> => {
  const [favorite, setFavorite] = useState<boolean>(club.is_favorite)
  const authCheck = useContext(AuthCheckContext)

  const updateFavorite = () => {
    authCheck(() =>
      apiSetFavoriteStatus(club.code, !favorite).then(() => {
        setFavorite(!favorite)
        onFavorite(!favorite)
      }),
    )
  }

  return (
    <BookmarkIconTag
      $favorite={favorite}
      $absolute={absolute}
      $padding={padding}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        updateFavorite()
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="feather feather-bookmark"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </BookmarkIconTag>
  )
}

type Props = {
  absolute?: boolean
  club: Club
  padding?: string
  onFavorite?: (status: boolean) => void
}
