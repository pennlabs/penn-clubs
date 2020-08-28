import Link from 'next/link'
import { ReactElement } from 'react'
import s from 'styled-components'

import {
  Contact,
  Container,
  InfoPageTitle,
  Line,
  Metadata,
  StrongText,
  Text,
  Title,
} from '../components/common'
import { CREATE_ROUTE } from '../constants'
import { SNOW } from '../constants/colors'
import renderPage from '../renderPage'

type QuestionProps = React.PropsWithChildren<{
  title: string
}>

const Question = ({ title, children }: QuestionProps): ReactElement => (
  <>
    <StrongText style={{ marginBottom: '0.5rem' }}>{title}</StrongText>
    <Text>
      {children}
      <br />
      <br />
    </Text>
  </>
)

const UnorderedList = s.ul`
  list-style-type: disc;
  margin-left: 2rem;
  margin-top: 0.5rem;
`

const FAQ = () => (
  <Container background={SNOW}>
    <Metadata title="FAQ" />
    <InfoPageTitle>Frequently Asked Questions</InfoPageTitle>
    <p>
      <Question title="What is Penn Clubs?">
        Penn Clubs is meant to be your central source of information about
        student organizations at the University of Pennsylvania. Keep
        discovering new clubs throughout the year, not just at the SAC Fair.
      </Question>
      <Question title="How can I provide feedback?">
        We’re so excited to let everyone at Penn contribute to the development
        of Penn Clubs! Your feedback is incredibly important to us. Have any
        questions or comments? Find any bugs?{' '}
        <a href="https://airtable.com/shrCsYFWxCwfwE7cf">
          Please let us know on our feedback form.
        </a>
      </Question>
      <Line />
      <Question title="Why do I have to log in?">
        Logging in allows us to create an account for you on Penn Clubs. This
        gives you access to many useful and upcoming features! When you bookmark
        a club, it will be saved to your bookmarked list. You can use this to
        keep track of clubs you’re interested in, or a part of. You can also be
        invited to join club Member lists. Finally, you'll need to log in if you
        want to use your administrator permissions to edit a club page.
      </Question>
      <Question title="How do I use this site?">
        The #1 way to use this site is to browse clubs at Penn! You can:
        <UnorderedList>
          <li>
            Search for clubs by name, and use filters like Tags (tags that
            describe the club), Size (number of members), and Application (if
            applications are required to join)
          </li>
          <li>Bookmark clubs to keep track of them</li>
          <li>
            Browse information that clubs post: description, how to join, member
            testimonials
          </li>
        </UnorderedList>
        <br />
        If you run a club, make sure your club has a page on Penn Clubs! This
        lets other students find out about your organization and how to get
        involved.
      </Question>
      <Question title="How do I edit an organization’s profile?">
        You’ll need to have administrator permission for that organization.
        We’ve invited people as administrators based on information submitted by
        clubs to SAC during Spring 2019.
        <UnorderedList>
          <li>
            If you did not receive administrator permission and you believe you
            should have, let us know at <Contact /> and we will work with you to
            verify your request.
          </li>
          <li>
            If your club did not submit this information to SAC, we’ve been
            contacting clubs by their listed email to ask for the names of
            people who need administrator permission. You can also email us at{' '}
            <Contact /> and we will work with you to verify your request.
          </li>
        </UnorderedList>
        <br />
        Note that there are 2 levels of administrators: Officers and Owners.
        Officers are able to edit the page, invite other members, and grant
        administrator permissions. In addition to those abilities, Owners are
        able to deactivate or delete the club page.
      </Question>
      <Question title="Why I can't find an organization on Penn Clubs?">
        Sorry about that! We’re in the process of making Penn Clubs as
        comprehensive as possible, creating the first complete directory of
        student organizations at Penn.
        <UnorderedList>
          <li>
            If you're an officer of a club and it <b>does not exist</b> on Penn
            Clubs, you can add your club using the form found{' '}
            <Link href={CREATE_ROUTE} as={CREATE_ROUTE}>
              <a>here</a>
            </Link>
            .
          </li>
          <li>
            If you're an officer of a club and it <b>already exists</b> on Penn
            Clubs, email <Contact /> to gain edit access for your club.
          </li>
          <li>
            Otherwise, if you're not the administrator of the club but would
            still like for it to be added to Penn Clubs, please email{' '}
            <Contact />.
          </li>
        </UnorderedList>
      </Question>
      <Question title="How are clubs ordered on Penn Clubs?">
        Click{' '}
        <Link href="/rank">
          <a>here</a>
        </Link>{' '}
        for details about our club recommendation algorithm.
      </Question>
      <Question title="I have another question!">
        <a href="https://airtable.com/shrCsYFWxCwfwE7cf">
          Please let us know on our feedback form :)
        </a>
      </Question>
      <Line />
      <Question title="Special Thanks">
        Thank you to the organizations below for their support in launching Penn
        Clubs! We're excited to continue building this valuable resource
        together.
        <br />
        <br />
        <div>
          {[
            {
              name: 'Student Activities Council',
              image: '/static/img/collaborators/sac.png',
              url: 'https://sacfunded.net/',
            },
            {
              name: 'Undergraduate Assembly',
              image: '/static/img/collaborators/ua.png',
              url: 'https://pennua.org/',
              height: 80,
            },
            {
              name: 'Office of Student Affairs',
              image: '/static/img/collaborators/osa.png',
              url: 'https://www.vpul.upenn.edu/osa/',
            },
          ].map(({ name, url, image, height }) => (
            <a href={url} target="_blank" key={name}>
              <img
                style={{
                  maxHeight: height || 100,
                  verticalAlign: 'middle',
                  margin: 10,
                }}
                src={image}
                alt={name}
                title={name}
              />
            </a>
          ))}
        </div>
      </Question>
    </p>
  </Container>
)

export default renderPage(FAQ)
