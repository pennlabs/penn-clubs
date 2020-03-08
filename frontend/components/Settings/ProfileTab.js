import { useState } from 'react'
import s from 'styled-components'

import ProfileForm from './ProfileForm'
import { LOGOUT_URL } from '../../utils'
import { Icon, SmallText, ProfilePic } from '../common'
import { MEDIUM_GRAY } from '../../constants/colors'
import { BODY_FONT } from '../../constants/styles'
import { logEvent } from '../../utils/analytics'

const Wrapper = s.div`
  font-family: ${BODY_FONT};
  font-size: 18px;
`

const LogoutIcon = s(Icon)`
  opacity: 0.5;
  margin-right: 4px;
`

const LogoutLink = s.a`
  color: ${MEDIUM_GRAY} !important;
  display: inline-block;
  margin-bottom: 12px;
`

const Empty = s.span`
  color: ${MEDIUM_GRAY};
`

const ProfilePicWrapper = s.div`
  margin-top: 0.5em;
  margin-left: 0.5em;
`

export default ({ defaults }) => {
  const [profile, setProfile] = useState(defaults)

  const { name, username, email, image_url } = profile

  return (
    <Wrapper>
      <div className="columns is-mobile">
        <div className="column is-narrow">
          <ProfilePicWrapper>
            <ProfilePic user={{ name, image: image_url }} />
          </ProfilePicWrapper>
        </div>
        <div className="column is-narrow" style={{ fontWeight: 600 }}>
          <div>Name</div>
          <div>Username</div>
          <div>Email</div>
        </div>
        <div className="column is-narrow">
          <div>{name || <Empty>None</Empty>}</div>
          <div>{username || <Empty>None</Empty>}</div>
          <div>{email || <Empty>None</Empty>}</div>
        </div>
      </div>
      <ProfileForm settings={profile} onUpdate={setProfile} />
      <br />
      <br />
      <SmallText>
        If your information is incorrect, please send an email to{' '}
        <a href="mailto:contact@pennclubs.com">contact@pennclubs.com</a>{' '}
        detailing your issue.
      </SmallText>
      <hr />
      <div>
        <LogoutLink
          className="button"
          href={`${LOGOUT_URL}?next=/`}
          onClick={() => logEvent('logout', 'click')}
        >
          <LogoutIcon name="log-out" alt="logout" />
          Logout
        </LogoutLink>
      </div>
    </Wrapper>
  )
}
