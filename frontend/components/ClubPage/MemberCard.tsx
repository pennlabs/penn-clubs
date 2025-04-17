import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement } from 'react'
import styled from 'styled-components'

import { PROFILE_ROUTE } from '../../constants'
import { WHITE } from '../../constants/colors'
import { M2, M3, mediaMinWidth, PHONE } from '../../constants/measurements'
import { Membership } from '../../types'
import { Card, ProfilePic } from '../common'

export const StyledCard = styled(Card)`
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

const Label = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const MemberInfo = styled.div`
  margin-left: 15px;

  ${mediaMinWidth(PHONE)} {
    margin-left: 0px;
  }
`

/**
 * Make the box appear clickable with the cursor change.
 * Move the margin bottom from the inner element to the outer element to make focusing look better.
 */
const ClickableBox = styled.div`
  cursor: pointer;
  width: 100%;
  & > div {
    margin-bottom: 0;
  }
  margin-bottom: ${M2};
`

type Props = {
  account: Membership
}

type OptionalProfileLinkProps = React.PropsWithChildren<{
  username?: string
}>

/**
 * Create a clickable link to the profile only if the username exists.
 */
const OptionalProfileLink = ({
  username,
  children,
}: OptionalProfileLinkProps): ReactElement<any> => {
  const router = useRouter()

  if (username != null) {
    return (
      <Link href={PROFILE_ROUTE()} as={PROFILE_ROUTE(username)} legacyBehavior>
        <ClickableBox
          onKeyPress={(e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
              e.preventDefault()
              router.push(PROFILE_ROUTE(), PROFILE_ROUTE(username))
            }
          }}
          tabIndex={0}
        >
          {children}
        </ClickableBox>
      </Link>
    )
  }
  return <>{children}</>
}

const MemberCard = ({ account }: Props): ReactElement<any> => {
  const { email, name, title, username } = account
  return (
    <OptionalProfileLink username={username}>
      <StyledCard $bordered>
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
                <a
                  onClick={(e) => e.stopPropagation()}
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
              </span>
            ) : (
              'Hidden Email'
            )}
          </Label>
        </MemberInfo>
      </StyledCard>
    </OptionalProfileLink>
  )
}

export default MemberCard
