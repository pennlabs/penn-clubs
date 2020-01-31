import { useEffect } from 'react'

import s from 'styled-components'

import { CLUB_ROUTE } from '../constants/routes'
import renderPage from '../renderPage'
import { doApiRequest } from '../utils'
import ProfileForm from '../components/Settings/ProfileForm'
import AuthPrompt from '../components/common/AuthPrompt'
import { Title, Text, Icon, Center, PhoneContainer } from '../components/common'
import Link from 'next/link'

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Subtitle = s(Title)`
  font-size: 1.3rem;
  margin-bottom: 1rem;
`

const TitleHeader = s.div`
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

const Welcome = ({ authenticated, query, userInfo, url }) => {
  const { next } = url.query

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
    <PhoneContainer>
      <TitleHeader>
        <Image src="/static/img/peoplelogo.png" />
        <Title>Welcome to Penn Clubs!</Title>
      </TitleHeader>
      <hr />
      <Center>
        <Text>
          Penn Clubs is your central source of information about student
          organizations at Penn.
        </Text>
      </Center>
      <hr />
      <Center>
        <Subtitle>1. Tell us about yourself</Subtitle>
        <Text>
          The info below helps us tailor your Penn Clubs experience to find
          clubs that you're likely to be interested in. It will also be shared
          with clubs that you choose to subscribe to. Feel free to leave fields
          blank if you'd prefer not the share this info.
        </Text>
      </Center>
      <ProfileForm settings={userInfo} />
      <hr />
      <Center>
        <Subtitle>2. Getting started</Subtitle>
        <Text>
          Here are two common buttons that you'll see around the site. Bookmarks
          and subscriptions can be managed from your Penn Clubs account at any
          time.
        </Text>
        <div className="columns is-mobile">
          <div className="column">
            <div className="button is-link is-large">
              <Icon alt="bookmark" name="bookmark" /> Bookmark
            </div>
            <Text style={{ marginTop: '0.5rem' }}>
              To save a club for later
            </Text>
          </div>
          <div className="column">
            <div className="button is-danger is-large">
              <Icon alt="subscribe" name="bell" /> Subscribe
            </div>
            <Text style={{ marginTop: '0.5rem' }}>
              To join the mailing list
            </Text>
          </div>
        </div>
      </Center>
      <hr />
      <Center>
        <Subtitle>3. Start exploring Penn Clubs!</Subtitle>
        <Link href={next && next.startsWith('/') ? next : CLUB_ROUTE()}>
          <a className="button is-success is-large" onClick={markWelcome}>
            Browse clubs
          </a>
        </Link>
      </Center>
    </PhoneContainer>
  )
}

Welcome.getInitialProps = async ({ query }) => {
  return { query }
}

export default renderPage(Welcome)
