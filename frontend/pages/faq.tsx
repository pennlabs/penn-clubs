import {
  Contact,
  Container,
  InfoPageTitle,
  Line,
  Metadata,
  StrongText,
} from 'components/common'
import Link from 'next/link'
import { ReactElement } from 'react'
import renderPage from 'renderPage'
import styled from 'styled-components'
import { MembershipRank } from 'types'
import {
  APPROVAL_AUTHORITY,
  APPROVAL_AUTHORITY_URL,
  FEEDBACK_URL,
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_NAME_LONG_PLURAL,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  PARTNER_LOGOS,
  SCHOOL_NAME,
  SHOW_RANK_ALGORITHM,
  SITE_ID,
  SITE_NAME,
  SUPPORT_EMAIL,
} from 'utils/branding'

import { CLUBS_HOME, CREATE_ROUTE, HUB_HOME, SNOW } from '~/constants'

type QuestionProps = React.PropsWithChildren<{
  title: string
}>

const QuestionText = styled.div`
  font-size: 1rem;
  margin-bottom: 2.5rem;
  line-height: 1.5;
`

const Question = ({ title, children }: QuestionProps): ReactElement<any> => (
  <>
    <StrongText style={{ marginBottom: '0.5rem' }}>{title}</StrongText>
    <QuestionText>{children}</QuestionText>
  </>
)

const UnorderedList = styled.ul`
  list-style-type: disc;
  margin-left: 2rem;
  margin-top: 0.5rem;
`

const THANKS_CONTENT = (): ReactElement<any> => (
  <Question title="Special Thanks">
    Thank you to the organizations below for their support in launching{' '}
    {SITE_NAME}! We're excited to continue building this valuable resource
    together.
    <br />
    <br />
    <div>
      {PARTNER_LOGOS.map(({ name, url, image, height, className }) => (
        <a
          href={url}
          target="_blank"
          key={name}
          className={className}
          rel="noopener noreferrer"
        >
          <img
            style={{
              maxHeight: height || 100,
              verticalAlign: 'middle',
              margin: 10,
            }}
            src={image}
            alt={name}
          />
        </a>
      ))}
    </div>
  </Question>
)

const GENERIC_TEMPLATE = (data): ReactElement<any> => (
  <div>
    <Question title={`What is ${SITE_NAME}?`}>
      {SITE_ID === 'fyh' ? (
        <>
          {SITE_NAME} is a place for the Penn community to find and connect with
          support resources. If you are looking for student clubs, check out{' '}
          <a href={CLUBS_HOME}>Penn Clubs</a>, the official registry for student
          organizations on campus.
        </>
      ) : (
        <>
          {SITE_NAME} is meant to be your central source of information about{' '}
          {OBJECT_NAME_LONG_PLURAL} at the {SCHOOL_NAME}. Keep discovering new{' '}
          {OBJECT_NAME_PLURAL} throughout the year, not just at{' '}
          {data.primaryMeeting}. If you are looking for official university
          support resources, check out <a href={HUB_HOME}>Hub@Penn</a>.
        </>
      )}
    </Question>
    <Question title="How can I provide feedback?">
      We're so excited to let everyone at the {SCHOOL_NAME} contribute to the
      development of {SITE_NAME}! Your feedback is incredibly important to us.
      Have any questions or comments? Find any bugs?{' '}
      <a rel="noopener noreferrer" href={FEEDBACK_URL}>
        Please let us know on our feedback form.
      </a>
    </Question>
    <Line />
    <Question title="Why do I have to log in?">
      Logging in allows us to create an account for you on {SITE_NAME}. This
      gives you access to many useful features!
      <UnorderedList>
        <li>
          When you bookmark a {OBJECT_NAME_SINGULAR}, it will be saved to your
          bookmarked list. You can use this to keep track of{' '}
          {OBJECT_NAME_PLURAL} you're interested in, or a part of.
        </li>
        <li>
          When you subscribe to a {OBJECT_NAME_SINGULAR}, you'll receive
          notifications about that {OBJECT_NAME_SINGULAR}. The{' '}
          {OBJECT_NAME_SINGULAR} will also be able to add you to their mailing
          lists.
        </li>
        <li>
          You'll be able to see events that {OBJECT_NAME_PLURAL} post to{' '}
          {SITE_NAME}.
        </li>
        <li>
          You can also be invited to join {OBJECT_NAME_SINGULAR} member lists.
        </li>
        <li>
          Finally, you'll need to log in if you want to use your administrator
          permissions to edit a {OBJECT_NAME_SINGULAR} page.
        </li>
      </UnorderedList>
    </Question>
    <Question title="How do I use this site?">
      The #1 way to use this site is to browse {OBJECT_NAME_PLURAL} at the{' '}
      {SCHOOL_NAME}! You can:
      <UnorderedList>
        <li>
          Search for {OBJECT_NAME_PLURAL} by name, and use filters like Tags
          (tags that describe the {OBJECT_NAME_SINGULAR}), Size (number of
          members), and Application (if applications are required to join)
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
      You’ll need to have administrator permission for that organization. We
      originally invited people as administrators based on information submitted
      by {OBJECT_NAME_PLURAL} to {data.originalDataSource}.
      <UnorderedList>
        <li>
          If you did not receive administrator permission and you believe you
          should have, let us know at <Contact email={SUPPORT_EMAIL} /> and we
          will work with you to verify your request.
        </li>
        <li>
          If your {OBJECT_NAME_SINGULAR} did not submit this information
          previously, we've been contacting {OBJECT_NAME_PLURAL} by their listed
          email to ask for the names of people who need administrator
          permission. You can also email us at <Contact email={SUPPORT_EMAIL} />{' '}
          and we will work with you to verify your request.
        </li>
      </UnorderedList>
      <br />
      Note that there are 2 levels of administrators:{' '}
      {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]}s and{' '}
      {MEMBERSHIP_ROLE_NAMES[MembershipRank.Owner]}s.{' '}
      {MEMBERSHIP_ROLE_NAMES[MembershipRank.Officer]}s are able to edit the
      page, invite other members, and grant administrator permissions. In
      addition to those abilities, {MEMBERSHIP_ROLE_NAMES[MembershipRank.Owner]}
      s are able to deactivate or delete the {OBJECT_NAME_SINGULAR} page.
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
            here
          </Link>
          .
        </li>
        <li>
          If you're an administator of a {OBJECT_NAME_SINGULAR} and it{' '}
          <b>already exists</b> on {SITE_NAME}, email{' '}
          <Contact email={SUPPORT_EMAIL} /> to gain edit access for your{' '}
          {OBJECT_NAME_SINGULAR}.
        </li>
        <li>
          Otherwise, if you're not the administrator of the{' '}
          {OBJECT_NAME_SINGULAR} but would still like for it to be added to{' '}
          {SITE_NAME}, please email <Contact email={SUPPORT_EMAIL} />.
        </li>
      </UnorderedList>
      <br />
      If you have any questions about the {OBJECT_NAME_SINGULAR} creation
      process, please email <Contact email={SUPPORT_EMAIL} />.
    </Question>
    <Question
      title={`Who is responsible for approving ${OBJECT_NAME_PLURAL} on ${SITE_NAME}?`}
    >
      Newly created {OBJECT_NAME_PLURAL} require approval from the{' '}
      <a href={APPROVAL_AUTHORITY_URL}>{APPROVAL_AUTHORITY}</a> in order to
      comply with university guidelines. When your {OBJECT_NAME_SINGULAR}{' '}
      requires review, it will be added to a queue that is periodically checked
      by the {APPROVAL_AUTHORITY}. You will be notified via email when your{' '}
      {OBJECT_NAME_SINGULAR} has been reviewed.
    </Question>
    {SHOW_RANK_ALGORITHM && (
      <Question
        title={`How are ${OBJECT_NAME_PLURAL} ordered on ${SITE_NAME}?`}
      >
        Click <Link href="/rank">here</Link> for details about our{' '}
        {OBJECT_NAME_SINGULAR} recommendation algorithm.
      </Question>
    )}
    <Question title="I have another question!">
      <a rel="noopener noreferrer" href={FEEDBACK_URL}>
        Please let us know on our feedback form :)
      </a>
    </Question>
    <Line />
    {THANKS_CONTENT()}
  </div>
)

const FAQS = {
  clubs: GENERIC_TEMPLATE({
    primaryMeeting: 'the SAC Fair',
    originalDataSource: 'SAC during Spring 2019',
  }),
  fyh: (
    <div>
      <Question title="What is Hub@Penn?">
        Hub@Penn is a place for the Penn community to find and connect with
        support resources. If you are looking for student clubs, check out{' '}
        <a href={CLUBS_HOME}>Penn Clubs</a>, the official registry for student
        organizations on campus.
      </Question>
      <Question title="How can I provide feedback?">
        We're so excited to let everyone at Penn contribute to the development
        of Hub@Penn! Your feedback is incredibly important to us. Have any
        questions or comments? Find any bugs?{' '}
        <a rel="noopener noreferrer" href={FEEDBACK_URL}>
          Please let us know on our feedback form.
        </a>
      </Question>
      <Line />
      <Question title="How do I use this site?">
        The #1 way to use this site is to browse resources at Penn! You can:
        <UnorderedList>
          <li>
            Search for a resource by name, and use filters like Tags (tags that
            describe the resource), student type (international, transfer,
            exchange, First-Generation and/or Lower Income/PennFirstPlus),
            student class year (first-year, second-year, junior, senior,
            graduate/professional)
          </li>
          <li>Bookmark resources to keep track of them</li>
          <li>
            Browse information that resources post: description, how to access,
            events, etc.
          </li>
        </UnorderedList>
        If you run a Penn resource, make sure your resource has a page on
        Hub@Penn! This lets students find out about your organization and how to
        get involved.
      </Question>
      <Question title="How do I edit a resource's profile?">
        You'll need to have administrator permission for that organization. If
        you did not receive administrator permission and you believe you should
        have, let us know at <Contact email={SUPPORT_EMAIL} /> and we will work
        with you to verify your request.
      </Question>
      <Question title="Why can't I find a certain resource on Hub@Penn?">
        Sorry about that! We’re in the process of making Hub@Penn as
        comprehensive as possible, creating the first complete directory of
        resources at Penn.
        <UnorderedList>
          <li>
            If you're in charge of a resource and it <b>does not exist</b> on
            Hub@Penn, you can add your resource using the form found{' '}
            <a href={CREATE_ROUTE}>here</a>.
          </li>
          <li>
            If you're in charge of a resource and it <b>already exists</b> on
            Hub@Penn, email <Contact email={SUPPORT_EMAIL} /> to gain edit
            access for your resource.
          </li>
          <li>
            Otherwise, if you're not the administrator of the resource but would
            still like for it to be added to Hub@Penn, please email{' '}
            <Contact email={SUPPORT_EMAIL} />.
          </li>
        </UnorderedList>
      </Question>
      <Question title="Who is responsible for approving resources on Hub@Penn?">
        Newly created resources require approval from the Hub@Penn
        administrators in order to comply with university guidelines. When your
        resource requires review, it will be added to a queue that is
        periodically checked. You will be notified when your resource has been
        reviewed.
      </Question>
      <Question title="I have another question!">
        <a rel="noopener noreferrer" href={FEEDBACK_URL}>
          Please let us know on our feedback form.
        </a>
      </Question>
      <Line />
      {THANKS_CONTENT()}
    </div>
  ),
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
