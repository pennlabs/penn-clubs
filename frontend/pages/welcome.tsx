import {
  Center,
  Container,
  Icon,
  Metadata,
  PhoneContainer,
  Text,
  Title,
} from 'components/common'
import AuthPrompt from 'components/common/AuthPrompt'
import LogoWithText from 'components/LogoWithText'
import ProfileForm from 'components/Settings/ProfileForm'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { UserInfo } from 'types'
import { doApiRequest } from 'utils'
import {
  OBJECT_NAME_LONG_PLURAL,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  SCHOOL_NAME,
  SITE_ID,
  SITE_NAME,
} from 'utils/branding'

import { HOME_ROUTE } from '~/constants/routes'

const Subtitle = styled(Title)`
  font-size: 1.3rem;
  margin-bottom: 1rem;
`

const TitleHeader = styled.div`
  margin-top: 1rem;
  text-align: center;

  h1 {
    margin-top: 1rem;
  }
`

const markWelcome = () => {
  doApiRequest('/settings/?format=json', {
    method: 'PATCH',
    body: {
      has_been_prompted: true, // eslint-disable-line camelcase
    },
  })
}

type WelcomeProps = {
  authenticated: boolean | null
  userInfo?: UserInfo
  nextUrl?: string
}

const Welcome = ({
  authenticated,
  userInfo: initialUserInfo,
  nextUrl,
}: WelcomeProps): ReactElement => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    initialUserInfo ?? null,
  )

  if (authenticated === false) {
    return <AuthPrompt />
  }

  if (userInfo === null) {
    return (
      <PhoneContainer>
        <TitleHeader>
          <Title>Loading...</Title>
        </TitleHeader>
      </PhoneContainer>
    )
  }

  useEffect(markWelcome, [])

  return (
    <>
      <Metadata title="Welcome!" />
      <Container>
        <TitleHeader>
          {SITE_ID === 'clubs' && <LogoWithText></LogoWithText>}
          <Title>Welcome to {SITE_NAME}!</Title>
        </TitleHeader>
        <hr />
        <Center>
          {nextUrl && !!nextUrl.length && nextUrl !== '/' && (
            <div className="notification is-primary">
              You're seeing this page because it is the first time you have
              logged into {SITE_NAME}. To skip this page, scroll down to the
              bottom and click "Continue".
            </div>
          )}
          <Text>
            {SITE_NAME} is your central source of information about{' '}
            {OBJECT_NAME_LONG_PLURAL} at the {SCHOOL_NAME}.
          </Text>
        </Center>
        <hr />
        <Center>
          <Subtitle>1. Tell us about yourself</Subtitle>
          <Text>
            The info below helps us tailor your {SITE_NAME} experience to find{' '}
            {OBJECT_NAME_PLURAL} that you're likely to be interested in. It will
            also be shared with {OBJECT_NAME_PLURAL} that you choose to
            subscribe to. Feel free to leave fields blank if you'd prefer not
            the share this information.
          </Text>
        </Center>
        <ProfileForm settings={userInfo} onUpdate={setUserInfo} />
        <hr />
        <Center>
          <Subtitle>2. Getting started</Subtitle>
          <Text>
            Here are two common buttons that you'll see around the site.
            Bookmarks and subscriptions can be managed from your {SITE_NAME}
            account at any time. Bookmarks (<Icon name="bookmark" />) are
            intended to be private and for your own personal use. Subscriptions
            (<Icon name="bell" />) are intended as a feature to give your
            information to the clubs that you are interested in.
          </Text>
          <div className="columns is-mobile">
            <div className="column">
              <div className="button is-link is-large">
                <Icon alt="bookmark" name="bookmark" /> Bookmark
              </div>
              <Text className="mt-1 mb-0">
                To save a {OBJECT_NAME_SINGULAR} for later
              </Text>
              <small>(For your own use)</small>
            </div>
            <div className="column">
              <div className="button is-danger is-large">
                <Icon alt="subscribe" name="bell" /> Subscribe
              </div>
              <Text className="mt-1 mb-0">To join the mailing list</Text>
              <small>(Contact info given to {OBJECT_NAME_SINGULAR})</small>
            </div>
          </div>
        </Center>
        <hr />
        <Center>
          <Subtitle>3. Start exploring {SITE_NAME}!</Subtitle>
          <Link
            legacyBehavior
            href={nextUrl && nextUrl.startsWith('/') ? nextUrl : HOME_ROUTE}
          >
            <a className="button is-success is-large" onClick={markWelcome}>
              {nextUrl && nextUrl.startsWith('/') && nextUrl !== HOME_ROUTE
                ? 'Continue'
                : `Browse ${OBJECT_NAME_PLURAL}`}
            </a>
          </Link>
        </Center>
      </Container>
    </>
  )
}

Welcome.getInitialProps = async ({
  query,
}: NextPageContext): Promise<{ nextUrl?: string }> => {
  return { nextUrl: !Array.isArray(query.next) ? query.next : undefined }
}

export default renderPage(Welcome)
