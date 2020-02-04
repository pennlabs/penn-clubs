import s from 'styled-components'
import { ProfilePic, Card } from '../common'
import { BORDER, WHITE } from '../../constants/colors'

import { mediaMinWidth, PHONE, M2, M3 } from '../../constants/measurements'

const StyledCard = s(Card)`
  text-align: left;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: ${M2};
  padding: ${M3} ${M2};
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
    <StyledCard bordered>
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
    </StyledCard>
  )
}

export default MemberCard
