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
} from '../components/common'
import { CREATE_ROUTE } from '../constants'
import { SNOW } from '../constants/colors'
import renderPage from '../renderPage'
import {
  APPROVAL_AUTHORITY,
  APPROVAL_AUTHORITY_URL,
  OBJECT_NAME_LONG_PLURAL,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  PARTNER_LOGOS,
  SCHOOL_NAME,
  SITE_ID,
  SITE_NAME,
} from '../utils/branding'

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

const GENERIC_TEMPLATE = (data) => (
  <p>
    <Question title={`What is ${SITE_NAME}?`}>
      {SITE_NAME} is meant to be your central source of information about
      {OBJECT_NAME_LONG_PLURAL} at the {SCHOOL_NAME}. Keep discovering new{' '}
      {OBJECT_NAME_PLURAL} throughout the year, not just at{' '}
      {data.primaryMeeting}.
    </Question>
    <Question title="How can I provide feedback?">
      We’re so excited to let everyone at the {SCHOOL_NAME} contribute to the
      development of {SITE_NAME}! Your feedback is incredibly important to us.
      Have any questions or comments? Find any bugs?{' '}
      <a href="https://airtable.com/shrCsYFWxCwfwE7cf">
        Please let us know on our feedback form.
      </a>
    </Question>
    <Line />
    <Question title="Why do I have to log in?">
      Logging in allows us to create an account for you on {SITE_NAME}. This
      gives you access to many useful and upcoming features! When you bookmark a{' '}
      {OBJECT_NAME_SINGULAR}, it will be saved to your bookmarked list. You can
      use this to keep track of {OBJECT_NAME_PLURAL} you’re interested in, or a
      part of. You can also be invited to join {OBJECT_NAME_SINGULAR} member
      lists. Finally, you'll need to log in if you want to use your
      administrator permissions to edit a {OBJECT_NAME_SINGULAR} page.
    </Question>
    <Question title="How do I use this site?">
      The #1 way to use this site is to browse {OBJECT_NAME_PLURAL} at the{' '}
      {SCHOOL_NAME}! You can:
      <UnorderedList>
        <li>
          Search for {OBJECT_NAME_PLURAL} by name, and use filters like Tags
          (tags that describe the club), Size (number of members), and
          Application (if applications are required to join)
        </li>
        <li>Bookmark {OBJECT_NAME_PLURAL} to keep track of them</li>
        <li>
          Browse information that {OBJECT_NAME_PLURAL} post: description, how to
          get involved or services that are offered, student experiences
        </li>
      </UnorderedList>
      <br />
      If you run a {OBJECT_NAME_SINGULAR}, make sure your {OBJECT_NAME_SINGULAR}{' '}
      has a page on {SITE_NAME}! This lets other students find out about your
      organization and how to get involved.
    </Question>
    <Question title="How do I edit an organization’s profile?">
      You’ll need to have administrator permission for that organization. We’ve
      invited people as administrators based on information submitted by{' '}
      {OBJECT_NAME_PLURAL} to {data.originalDataSource}.
      <UnorderedList>
        <li>
          If you did not receive administrator permission and you believe you
          should have, let us know at <Contact /> and we will work with you to
          verify your request.
        </li>
        <li>
          If your {OBJECT_NAME_SINGULAR} did not submit this information
          previously, we've been contacting {OBJECT_NAME_PLURAL} by their listed
          email to ask for the names of people who need administrator
          permission. You can also email us at <Contact /> and we will work with
          you to verify your request.
        </li>
      </UnorderedList>
      <br />
      Note that there are 2 levels of administrators: Officers and Owners.
      Officers are able to edit the page, invite other members, and grant
      administrator permissions. In addition to those abilities, Owners are able
      to deactivate or delete the {OBJECT_NAME_SINGULAR} page.
    </Question>
    <Question title={`Why I can't find an organization on ${SITE_NAME}?`}>
      Sorry about that! We’re in the process of making {SITE_NAME} as
      comprehensive as possible, creating the first complete directory of{' '}
      {OBJECT_NAME_LONG_PLURAL} at the {SCHOOL_NAME}.
      <UnorderedList>
        <li>
          If you're an administrator of a {OBJECT_NAME_SINGULAR} and it{' '}
          <b>does not exist</b> on {SITE_NAME}, you can add your{' '}
          {OBJECT_NAME_SINGULAR} using the form found{' '}
          <Link href={CREATE_ROUTE} as={CREATE_ROUTE}>
            <a>here</a>
          </Link>
          .
        </li>
        <li>
          If you're an administator of a {OBJECT_NAME_SINGULAR} and it{' '}
          <b>already exists</b> on {SITE_NAME}, email <Contact /> to gain edit
          access for your {OBJECT_NAME_SINGULAR}.
        </li>
        <li>
          Otherwise, if you're not the administrator of the{' '}
          {OBJECT_NAME_SINGULAR} but would still like for it to be added to{' '}
          {SITE_NAME}, please email <Contact />.
        </li>
      </UnorderedList>
      <br />
      If you have any questions about the {OBJECT_NAME_SINGULAR} creation
      process, please email <Contact />.
    </Question>
    <Question
      title={`Who is responsible for approving ${OBJECT_NAME_PLURAL} on ${SITE_NAME}?`}
    >
      Newly created {OBJECT_NAME_PLURAL} require approval from the{' '}
      <a href={APPROVAL_AUTHORITY_URL}>{APPROVAL_AUTHORITY}</a> in order to
      comply with university guidelines. When your {OBJECT_NAME_SINGULAR}{' '}
      requires review, it will be added to a queue that is periodically checked
      by the {APPROVAL_AUTHORITY}. You will be notified when your{' '}
      {OBJECT_NAME_SINGULAR} has been reviewed.
    </Question>
    <Question title={`How are ${OBJECT_NAME_PLURAL} ordered on ${SITE_NAME}?`}>
      Click{' '}
      <Link href="/rank">
        <a>here</a>
      </Link>{' '}
      for details about our {OBJECT_NAME_SINGULAR} recommendation algorithm.
    </Question>
    <Question title="I have another question!">
      <a href="https://airtable.com/shrCsYFWxCwfwE7cf">
        Please let us know on our feedback form :)
      </a>
    </Question>
    <Line />
    <Question title="Special Thanks">
      Thank you to the organizations below for their support in launching{' '}
      {SITE_NAME}! We're excited to continue building this valuable resource
      together.
      <br />
      <br />
      <div>
        {PARTNER_LOGOS.map(({ name, url, image, height, className }) => (
          <a href={url} target="_blank" key={name} className={className}>
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
)

const FAQS = {
  clubs: GENERIC_TEMPLATE({
    primaryMeeting: 'the SAC Fair',
    originalDataSource: 'SAC during Spring 2019',
  }),
  fyh: GENERIC_TEMPLATE({
    primaryMeeting: 'New Student Orientation',
    originalDataSource: 'the Online Learning Initiative during Fall 2020',
  }),
}

const FAQ = () => (
  <Container background={SNOW}>
    <Metadata title="Frequently Asked Questions" />
    <InfoPageTitle>Frequently Asked Questions</InfoPageTitle>
    {FAQS[SITE_ID] ?? (
      <p>
        There is currently no FAQ page for this site. If you believe that this
        is an error, please contact <Contact />.
      </p>
    )}
  </Container>
)

export default renderPage(FAQ)
