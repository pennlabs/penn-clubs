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
        <Title>Welcome to Penn Clubs!</Title>
      </TitleHeader>
      <hr />
      <Center>
        <Text>
          Penn Clubs is meant to be your central source of information about student organizations at the University of Pennsylvania. Keep discovering new clubs throughout the year, not just at the SAC Fair.
        </Text>
      </Center>
      <hr />
      <Center>
        <Text>
          Providing basic academic information below will tailor your Penn Clubs experience to help you find the clubs that you are interested in.
          This information will also be shared with clubs that you choose to subscribe to.
          If you would not like to provide any particular detail, leave that field blank.
        </Text>
      </Center>
      <ProfileForm settings={userInfo} />
      <hr />
      <Center>
        <Text>
          Here are two common buttons that you'll see and descriptions about what they do.
        </Text>
        <div className="columns is-mobile">
          <div className="column">
            <div
              disabled={true}
              className="button is-link is-large">
              <Icon alt='bookmark' name='bookmark' /> Bookmark
            </div>
            <Text style={{ marginTop: '0.5rem' }}>To save a club for later</Text>
          </div>
          <div className="column">
            <div
              disabled={true}
              className="button is-danger is-large">
              <Icon alt='subscribe' name='bell' /> Subscribe
            </div>
            <Text style={{ marginTop: '0.5rem' }}>To join the mailing list</Text>
          </div>
        </div>
        <SmallText><i>Bookmarks and subscriptions can be managed from your Penn Clubs account at any time.</i></SmallText>
      </Center>
      <hr />
      <Center>
        <Text>Start exploring Penn Clubs!</Text>
        <Link href={next && next.startswith('/') ? next : '/'}>
          <a className="button is-danger is-large" onClick={(e) => {
            doApiRequest('/settings/?format=json', {
              method: 'PATCH',
              body: {
                has_been_prompted: true, // eslint-disable-line camelcase
              },
            })
          }}>{next ? 'Continue' : 'Browse clubs'}</a>
        </Link>
      </Center>
    </PhoneContainer>
  )
}

Welcome.getInitialProps = async ({ query }) => {
  return { query }
}

export default renderPage(Welcome)
