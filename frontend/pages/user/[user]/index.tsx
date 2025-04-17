import ClubCard from 'components/ClubCard'
import {
  Contact,
  Container,
  Icon,
  Metadata,
  ProfilePic,
  Subtitle,
  Text,
  Title,
} from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import { NextPageContext } from 'next'
import Link from 'next/link'
import React, { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { MembershipRank, UserInfo, UserProfile } from 'types'
import { doApiRequest, getCurrentSchoolYear } from 'utils'
import { OBJECT_NAME_PLURAL, OBJECT_NAME_TITLE } from 'utils/branding'

import {
  BULMA_INFO,
  CLUBS_BLUE,
  CLUBS_GREY,
  CLUBS_PURPLE,
  SETTINGS_ROUTE,
  WHITE,
} from '~/constants'

type UserProfilePageProps = {
  profile: UserProfile | { detail: string }
  authenticated: boolean | null
  userInfo?: UserInfo
}

const GraduationYearTag = ({
  year,
}: {
  year: number | null
}): ReactElement<any> => {
  const now = getCurrentSchoolYear() + 1
  if (year == null || typeof year !== 'number') {
    return <span className="tag is-light ml-1">Unknown</span>
  }
  if (year < now) {
    return <span className="tag is-light ml-1">Alumni</span>
  }
  const mapping = {
    0: 'Senior',
    1: 'Junior',
    2: 'Second Year',
    3: 'First Year',
  }
  const diff = year - now
  if (diff in mapping) {
    return <span className="tag is-primary ml-1">{mapping[diff]}</span>
  }
  return <span className="tag is-light ml-1">Unknown</span>
}

const ClubCardAddon = styled.div<{ rank: number; active: boolean }>`
  float: right;
  color: ${WHITE};
  background-color: ${({ rank, active }) =>
    active
      ? {
          [MembershipRank.Member]: BULMA_INFO,
          [MembershipRank.Officer]: CLUBS_BLUE,
          [MembershipRank.Owner]: CLUBS_PURPLE,
        }[rank]
      : CLUBS_GREY};
  padding: 5px 12px;
  border-radius: 0 0 5px 5px;
  margin-right: 12px;
`

const UserProfilePage = ({
  profile,
  authenticated,
  userInfo,
}: UserProfilePageProps): ReactElement<any> => {
  if ('detail' in profile) {
    return (
      <>
        <Metadata title="User Profile" />
        <AuthPrompt title="Oh no!" hasLogin={!authenticated}>
          You cannot view the profile for this user. This user might not exist
          or have set their profile to private.
        </AuthPrompt>
      </>
    )
  }

  const isSelf = userInfo?.username === profile.username

  return (
    <Container paddingTop>
      <Metadata title={profile.name} />
      {isSelf && (
        <div className="notification is-info is-light">
          <Icon name="alert-circle" /> This is your profile page. You will
          always be able to see all of the information shown here. Currently,
          other people <b>{userInfo?.show_profile ? 'can' : 'cannot'}</b> see
          this page. To change this, go to the{' '}
          <Link href={SETTINGS_ROUTE + '#Profile'}>settings page</Link>.
        </div>
      )}
      {!isSelf && !profile.public && (
        <div className="notification is-warning is-light">
          <Icon name="alert-circle" /> {profile.name} has not chosen to make
          their profile public. You can only view this page because you have
          administrator privileges.
        </div>
      )}
      <div className="is-clearfix mb-5">
        <div className="is-pulled-left mr-3">
          <ProfilePic
            size="is-128x128"
            user={{ name: profile.name, image: profile.image_url }}
            isCentered={false}
            fontSize="2.5em"
          />
        </div>
        <div className="is-pulled-left">
          <Title>{profile.name}</Title>
          <div className="tags mb-0">
            {profile.school
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((school) => (
                <span key={school.id} className="tag is-info">
                  {school.name}
                </span>
              ))}
          </div>
          <div className="tags mb-0">
            {profile.major
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((major) => (
                <span key={major.id} className="tag is-info is-light">
                  {major.name}
                </span>
              ))}
          </div>
          <div>
            <b>Username:</b>{' '}
            <span className="is-family-monospace">{profile.username}</span>
          </div>
          <div>
            <b>Graduation Year:</b> {profile.graduation_year ?? 'Unknown'}{' '}
            <GraduationYearTag year={profile.graduation_year} />
          </div>
          <div>
            <b>Email:</b>{' '}
            {profile.email != null && profile.email.length > 0 ? (
              <Contact email={profile.email} />
            ) : (
              'None'
            )}
          </div>
        </div>
      </div>
      <Subtitle>{OBJECT_NAME_TITLE}</Subtitle>
      {profile.clubs.length > 0 ? (
        <div className="columns is-multiline is-desktop is-tablet">
          {profile.clubs
            .sort((a, b) => a.membership.role - b.membership.role)
            .map((club) => {
              return (
                <div
                  key={club.code}
                  className="column is-half-desktop is-clearfix"
                >
                  <ClubCard fullWidth club={club} />
                  <ClubCardAddon
                    active={club.membership.active}
                    rank={club.membership.role}
                  >
                    {club.membership.active ? club.membership.title : 'Alumni'}
                  </ClubCardAddon>
                </div>
              )
            })}
        </div>
      ) : (
        <Text>
          There are no {OBJECT_NAME_PLURAL} to display. This user may not be a
          member of any {OBJECT_NAME_PLURAL} or have chosen to hide their
          memberships.
        </Text>
      )}
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
