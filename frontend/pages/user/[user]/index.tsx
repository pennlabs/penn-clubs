import { NextPageContext } from 'next'
import Link from 'next/link'
import React, { ReactElement } from 'react'

import ClubCard from '../../../components/ClubCard'
import {
  Contact,
  Container,
  Icon,
  Metadata,
  Subtitle,
  Text,
  Title,
} from '../../../components/common'
import AuthPrompt from '../../../components/common/AuthPrompt'
import { SETTINGS_ROUTE } from '../../../constants'
import renderPage from '../../../renderPage'
import { UserInfo, UserProfile } from '../../../types'
import { doApiRequest } from '../../../utils'
import { OBJECT_NAME_TITLE } from '../../../utils/branding'

type UserProfilePageProps = {
  profile: UserProfile | { detail: string }
  authenticated: boolean | null
  userInfo?: UserInfo
}

const UserProfilePage = ({
  profile,
  authenticated,
  userInfo,
}: UserProfilePageProps): ReactElement => {
  if ('detail' in profile) {
    return (
      <AuthPrompt title="Oh no!" hasLogin={!authenticated}>
        You cannot view the profile for this user. This user might not exist or
        have set their profile to private.{' '}
        <span className="has-text-grey">{profile.detail}</span>
      </AuthPrompt>
    )
  }

  return (
    <Container>
      <Metadata title={profile.name} />
      {userInfo?.username === profile.username && (
        <div className="notification is-info is-light">
          <Icon name="alert-circle" /> This is your profile page. You will
          always be able to see all of the information shown here. Currently,
          other people <b>{userInfo?.show_profile ? 'can' : 'cannot'}</b> see
          this page. To change this, go to the{' '}
          <Link href={SETTINGS_ROUTE + '#Profile'}>
            <a>settings page</a>
          </Link>
          .
        </div>
      )}
      <Title>{profile.name}</Title>
      <Text>Gradution Year: {profile.graduation_year ?? 'Unknown'}</Text>
      <Text>Username: {profile.username}</Text>
      <Text>
        Email: <Contact email={profile.email} />
      </Text>
      <Subtitle>{OBJECT_NAME_TITLE}</Subtitle>
      <div className="columns is-multiline is-desktop is-tablet">
        {profile.clubs.map((club) => {
          return <ClubCard key={club.code} club={club} />
        })}
      </div>
    </Container>
  )
}

UserProfilePage.getInitialProps = async (
  ctx: NextPageContext,
): Promise<{ profile: UserProfile }> => {
  const { query, req } = ctx
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const resp = await doApiRequest(
    `/users/${encodeURIComponent(query.user as string)}/?format=json`,
    data,
  )
  const respData = await resp.json()

  return { profile: respData }
}

export default renderPage(UserProfilePage)
