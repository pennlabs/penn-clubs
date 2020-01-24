import s from 'styled-components'
import { PROPIC_BACKGROUND, PROPIC_TEXT } from '../../constants/colors'


const Avatar = s.img`
  width: 100%;
  height: 100%;

  ${({ isRound }) => isRound ? 'border-radius: 9999px;' : ''}
`

export const ProfilePic = ({ className, user, isRound, style, fontSize }) => {
  const { name, image } = user
  if (image) return <Avatar src={image} isRound={isRound} />

}
