import s from 'styled-components'

import { Contact, Container, Metadata, Title } from '../components/common'
import { SNOW } from '../constants/colors'
import { M4 } from '../constants/measurements'
import renderPage from '../renderPage'

type QuestionProps = React.PropsWithChildren<{
  title: string
}>

const Subheading = s.div`
  margin-top: 1.5rem;
  font-size: ${M4};
  font-weight: bold;
  margin-bottom: 0.5rem;
`

const UnorderedList = s.ul`
  list-style-type: disc;
  margin-left: 2rem;
  margin-top: 0.5rem;
`

const SACGuide = () => (
  <Container background={SNOW}>
    <Metadata title="SAC Fair Guide" />
    <Title style={{ paddingTop: '2.5vw', paddingBottom: '2rem' }}>
      Virtual SAC Fair Guide
    </Title>
    <p>
      Hi there! Welcome to <strong>Penn Clubs</strong>, the University of
      Pennsylvania's official registry for student organizations on campus. The
      purpose of this guide is to walk you through the many different features
      that Penn Clubs can offer that will make your experience recruiting new
      members as easy as possible.
    </p>

    <Subheading>REQUIRED: Editing Your SAC Fair "Booth"</Subheading>

    <p>
      You will need to add a Zoom link to your club's SAC Fair event. Once you
      navigate to your club, click the green "Manage Club" button on the
      top-right corner of the page. If you do not see this button, it means you
      are not an officer of the club. Either ask an officer listed on your club
      to add you to the site through the "Membership" tab of the "Manage Club"
      page, or email <Contact /> with your Penn email and club name to be added
      as an officer.
    </p>
    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/1.png'}
      alt={'Manage Club Button'}
      title={'Manage Club Button'}
    />
    <p>Then, click the "Events" tab:</p>
    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/2.png'}
      alt={'Events Tab'}
      title={'Events Tab'}
    />

    <p>
      There will be an existing event with your designated date & time titled
      "SAC Fair Info Session". Click "Edit".
    </p>
    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/3.png'}
      alt={'Edit SAC Fair Event'}
      title={'Edit SAC Fair Event'}
    />
    <p>
      Edit the club details: you <strong>MUST</strong> provide a Zoom link
      (preferably from your school Zoom account) where prospective students can
      navigate to. You can add a description, as well as upload a cover photo
      (dimensions 16:9) to make your event stand out in the live events portal.
      Be sure to{' '}
      <strong>
        hit the green "save" button on the lefthand side when you are done!
      </strong>
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/4.png'}
      alt={'Save SAC Fair Changes'}
      title={'Save SAC Fair Changes'}
    />

    <Subheading>Zoom Best Practices</Subheading>
    <p>
      To get all possible features, please use an account using the school's
      licensed Zoom accounts. You should have received an email from your home
      school about obtaining login credentials for this. Schedule a new meeting,
      using the <strong>given date and time</strong> as outlined in the e-mail
      given to you by SAC with these settings:
    </p>
    <UnorderedList>
      <li>A required meeting password</li>
      <li>Under Advanced Options:</li>
      <UnorderedList>
        <li>
          Waiting room – <strong>disabled</strong>
        </li>
        <li>
          Mute participants upon entry – <strong>enabled</strong>
        </li>
        <li>
          Only authenticated users can join – <strong>enabled</strong>
        </li>
      </UnorderedList>
    </UnorderedList>

    <p>When hosting your event:</p>
    <UnorderedList>
      <li>
        Make all present mebers of the session <strong>co-hosts</strong> to help
        control the session.
      </li>
      <li>
        Have the <strong>chat window open</strong> to answer any questions. For
        busier sessions, we recommend designating one member to be monitoring
        the chat window
      </li>
      <li>
        For busier sessions where multiple club members are present, we
        recommend taking advantage of the <strong>breakout room feature</strong>
        , which can be prompted by hosts. We would suggest{' '}
        <strong>manually assigning</strong> people to a breakout room, to ensure
        a member of the club is there to answer questions.
      </li>
    </UnorderedList>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/5.png'}
      alt={'Zoom Breakout Rooms'}
      title={'Zoom Breakout Rooms'}
    />

    <Subheading>Recruitment Resources</Subheading>
    <p>
      Tired of creating a Google Form to track all interested members? Now,
      students can click the "Subscribe" bell button on your club's page to
      immediately be added to your club's own listserv without spending the time
      to fill out a form.
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/6.png'}
      alt={'Subscribe Button'}
      title={'Subscribe Button'}
    />

    <p>
      To access this listserv, simply navigate to "Manage Club" once again, then
      to the "Recruitment" tab. Here, you will also find a QR code your club can
      use for members to bookmark or subscribe to your club. You will also see a
      table of members who have subscribed to your club. You can scroll to the
      bottom to download an Excel file of all these members' names, emails, and
      more self-reported information.
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/7.png'}
      alt={'Listserv'}
      title={'Listserv'}
    />

    <Subheading>Club FAQ</Subheading>
    <p>
      To facilitate asynchronous interactions with prospective members, we also
      have an FAQ section on each club's page. When students post a question,
      all officers listed under the club will receive an email notification that
      a question for your club has been asked.
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/8.png'}
      alt={'Club FAQ'}
      title={'Club FAQ'}
    />

    <p>
      To answer the questions, navigate once again to the "Manage Club", and
      then to the "Questions" tab, where you can see all questions asked and
      answer or delete them.
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/9.png'}
      alt={'Answering questions for Clubs'}
      title={'Answering questions for Clubs'}
    />

    <Subheading>Managing Members</Subheading>
    <p>
      As you can tell, there is a lot of responsibility for club owners already.
      To help lessen the load, you can invite other officers of your club to
      join your club's profile. Click the "Manage Club" button once again, and
      then navigate to the "Membership" tab. By entering email addresses
      (separated by commas or newlines) you can send invites to all the officers
      of your club by clicking the "Officer" status under Permissions. You can
      do the same with non-officer members, but leaving their status as
      "Member".{' '}
      <strong>
        Only Officers and Owners of a club can use the Manage Club button.
      </strong>
    </p>

    <img
      style={{
        maxHeight: 400,
        verticalAlign: 'middle',
        margin: 10,
        padding: 10,
      }}
      src={'static/img/sacfair_screencaps/10.png'}
      alt={'Managing club members'}
      title={'Managing club members'}
    />

    <Subheading>Settings</Subheading>
    <p>
      We encourage clubs to keep their club pages as up-to-date as possible with
      descriptions, members, social media links, events, and more! Check out{' '}
      <a href="/rank">ranking algorithm here </a>our to discover ways to boost
      your club and events to the top of Penn Clubs, simply by providing more
      information on your club for prospective members.
    </p>
  </Container>
)

export default renderPage(SACGuide)
