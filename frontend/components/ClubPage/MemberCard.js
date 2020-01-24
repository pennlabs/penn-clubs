import s from 'styled-components'
import { ProfilePic } from '../common'
import { BORDER } from '../../constants/colors'

const Card = s.div`
  text-align: center;
  box-sizing: border-box;
  width: 100%;
  margin-right: 1%;
  margin-bottom: 20px;
  padding: 20px 10px;
  border: 1px solid ${BORDER};
  display: inline-block;
  background-color: white;
`

const Label = s.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Avatar = s.div`
  border-radius: 9999px;
  margin: 0 auto;
`

const MemberCard = ({ account }) => {
  const { email, name, title } = account
  return (
    <Card>
      <Avatar className="has-background-light image is-64x64">
        <ProfilePic user={account} fontSize="24px" isRound />
      </Avatar>
      <br />
      <Label className="title is-5">{name || 'No Name'}</Label>
      <Label className="subtitle is-6">{title}</Label>
      <Label className="subtitle is-6">
        {email
          ? (
            <span>
              <a href={`mailto:${email}`}>{email}</a>
            </span>
          )
          : 'No Email'
        }
      </Label>
    </Card>
  )
}

export default MemberCard
