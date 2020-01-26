import s from 'styled-components'
import { ProfilePic } from '../common'
import { BORDER, WHITE } from '../../constants/colors'

import {
  mediaMinWidth,
  PHONE,
} from '../../constants/measurements'

const Card = s.div`
  text-align: left;
  box-sizing: border-box;
  width: 100%;
  margin-right: 1%;
  margin-bottom: 20px;
  padding: 20px 10px;
  border: 1px solid ${BORDER};
  display: flex;
  flex-direction: row;
  background-color: ${WHITE};

  ${mediaMinWidth(PHONE)} {
    text-align: center;
    display: inline-block;
  }
`

const Label = s.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MemberInfo = s.div`
  margin-left: 15px;

  ${mediaMinWidth(PHONE)} {
    margin-left: 0px;
  }
`

const Avatar = s.div`
  border-radius: 50%;
  margin: 5px 15px;
  ${mediaMinWidth(PHONE)} {
    margin: 0 auto;
  }
`

const MemberCard = ({ account }) => {
  const { email, name, title } = account
  return (
    <Card>
      <Avatar className="has-background-light image is-64x64">
        <ProfilePic user={account} fontSize="24px" isRound />
      </Avatar>
      <br />
      <MemberInfo>
        <Label style={{ fontSize: '1.1em' }}>
          <b>{name || 'No Name'}</b>
        </Label>
        <Label style={{ fontSize: '0.9em' }}>{title}</Label>
        <Label style={{ fontSize: '0.9em' }}>
          {email ? (
            <span>
              <a href={`mailto:${email}`}>{email}</a>
            </span>
          ) : (
            'No Email'
          )}
        </Label>
      </MemberInfo>
    </Card>
  )
}

export default MemberCard
