import { ReactElement } from 'react'
import s from 'styled-components'

import { WHITE } from '../../constants/colors'
import { M2, M3, mediaMinWidth, PHONE } from '../../constants/measurements'
import { Membership } from '../../types'
import { Card, ProfilePic } from '../common'

export const StyledCard = s(Card)`
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

type Props = {
  account: Membership
}

const MemberCard = ({ account }: Props): ReactElement => {
  const { email, name, title } = account
  return (
    <StyledCard bordered>
      <ProfilePic user={account} fontSize="24px" isRound />
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
            'Hidden Email'
          )}
        </Label>
      </MemberInfo>
    </StyledCard>
  )
}

export default MemberCard
