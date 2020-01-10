import s from 'styled-components'

import renderPage from '../renderPage'
import { doApiRequest, LOGIN_URL } from '../utils'
import ProfileForm from '../components/Settings/ProfileForm'
import {
  Title,
  Text,
  Icon,
  SmallText,
} from '../components/common'
import Link from 'next/link'

const PhoneContainer = s.div`
  margin: 15px auto;
  padding: 15px;
  max-width: 420px;
`

const Image = s.img`
  height: 86px;
  width: auto;
  max-width: 242px;
  margin-right: 1rem;
  object-fit: contain;
`

const Center = s.div`
  text-align: center;
`

const Margin = s.div`
  margin: 1rem;
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

const Welcome = ({ authenticated, query, userInfo, url }) => {
  const { next } = url.query

  if (authenticated === false) {
    return (
      <PhoneContainer>
        <Center>
          <TitleHeader>
            <Image src="/static/img/peoplelogo.png" />
            <Title>One last step...</Title>
          </TitleHeader>
          <Margin>
            <Text>To make the most of Penn Clubs features, like bookmarking and subscribing to clubs, please login using your PennKey.</Text>
          </Margin>
          <Margin>
            <a href={`${LOGIN_URL}?next=${typeof window !== 'undefined' ? window.location.href : '/'}`} className="button is-link is-large"><Icon alt="login" name="key" /> Continue to login</a>
          </Margin>
          <SmallText><i>(We're sorry, we hate two-step too.)</i></SmallText>
        </Center>
      </PhoneContainer>
    )
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

  return (
    <PhoneContainer>
      <TitleHeader>
        <Image src="/static/img/peoplelogo.png" />
        <Title>Welcome to Penn Clubs!</Title>
      </TitleHeader>
      <hr />
      <Center>
        <Text>
          Penn Clubs is your central source of information about student organizations at Penn.
        </Text>
      </Center>
      <hr />
      <Center>
        <Subtitle>
          1. Tell us about yourself
        </Subtitle>
        <Text>
          The info below helps us tailor your Penn Clubs experience to find clubs that you're likely to be interested in.
          It will also be shared with clubs that you choose to subscribe to.
          Feel free to leave fields blank if you'd prefer not the share this info.
        </Text>
      </Center>
      <ProfileForm settings={userInfo} />
      <hr />
      <Center>
        <Subtitle>
          2. Getting started
        </Subtitle>
        <Text>
          Here are two common buttons that you'll see around the site.
          Bookmarks and subscriptions can be managed from your Penn Clubs account at any time.
        </Text>
        <div className="columns is-mobile">
          <div className="column">
            <div
              className="button is-link is-large">
              <Icon alt='bookmark' name='bookmark' /> Bookmark
            </div>
            <Text style={{ marginTop: '0.5rem' }}>To save a club for later</Text>
          </div>
          <div className="column">
            <div
              className="button is-danger is-large">
              <Icon alt='subscribe' name='bell' /> Subscribe
            </div>
            <Text style={{ marginTop: '0.5rem' }}>To join the mailing list</Text>
          </div>
        </div>
      </Center>
      <hr />
      <Center>
        <Subtitle>3. Start exploring Penn Clubs!</Subtitle>
        <Link href={next && next.startsWith('/') ? next : '/'}>
          <a className="button is-success is-large" onClick={(e) => {
            doApiRequest('/settings/?format=json', {
              method: 'PATCH',
              body: {
                has_been_prompted: true, // eslint-disable-line camelcase
              },
            })
          }}>Browse clubs</a>
        </Link>
      </Center>
    </PhoneContainer>
  )
}

Welcome.getInitialProps = async ({ query }) => {
  return { query }
}

export default renderPage(Welcome)
