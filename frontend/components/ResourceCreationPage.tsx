import Link from 'next/link'
import React, { ReactElement, useState } from 'react'

import {
  CLUB_ROUTE,
  CLUBS_HOME,
  DIRECTORY_ROUTE,
  RED,
  SNOW,
} from '../constants'
import { Club, Major, School, StudentType, Tag, Year } from '../types'
import { doApiRequest } from '../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SCHOOL_NAME,
  SITE_NAME,
} from '../utils/branding'
import ClubCard from './ClubCard'
import AdvisorCard from './ClubEditPage/AdvisorCard'
import ClubEditCard from './ClubEditPage/ClubEditCard'
import EnableSubscriptionCard from './ClubEditPage/EnableSubscriptionCard'
import FormProgressIndicator from './ClubEditPage/FormProgressIndicator'
import MemberExperiencesCard from './ClubEditPage/MemberExperiencesCard'
import {
  Center,
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Line,
  Loading,
  Metadata,
  Subtitle,
  Text,
  Title,
} from './common'
import AuthPrompt from './common/AuthPrompt'

type ResourceCreationPageProps = {
  club?: Club
  authenticated: boolean | null
  schools: School[]
  years: Year[]
  majors: Major[]
  tags: Tag[]
  studentTypes: StudentType[]
}

type TabItem = {
  name: string
  content: () => ReactElement
  disabled?: boolean
  onEnterTab?: () => Promise<void>
}

const ResourceCreationPage = ({
  club: initialClub,
  authenticated,
  schools,
  years,
  majors,
  tags,
  studentTypes,
}: ResourceCreationPageProps): ReactElement => {
  const isResuming = initialClub != null
  const metadata = (
    <Metadata
      title={`${
        isResuming ? 'Continue Creating' : 'Create'
      } ${OBJECT_NAME_TITLE_SINGULAR}`}
    />
  )
  const [step, setStep] = useState<number>(0)
  const [advisorsValid, validateAdvisors] = useState<boolean>(
    (initialClub?.advisor_set.length ?? 0) > 0,
  )
  const [club, setClub] = useState<Club | null>(initialClub ?? null)
  const [message, setMessage] = useState<ReactElement | string | null>(null)

  if (authenticated === false) {
    return <AuthPrompt>{metadata}</AuthPrompt>
  }
  if (authenticated === null) {
    return <Loading />
  }

  const nextStep = () => {
    const enterTab = steps[step + 1].onEnterTab
    if (enterTab !== undefined) {
      enterTab()
        .then(() => {
          setStep(step + 1)
        })
        .catch(() => {
          setStep(step + 1)
        })
    } else {
      setStep(step + 1)
    }
  }

  const steps: TabItem[] = [
    {
      name: 'Introduction',
      content: (): ReactElement => (
        <>
          <Title>Introduction</Title>
          {isResuming &&
            (club?.active ? (
              <div className="notification is-success">
                <Icon name="check" /> You have finished the{' '}
                {OBJECT_NAME_SINGULAR} creation process for {club?.name}. You do
                not need to fill out this form, but any changes you make here
                will be reflected on your {OBJECT_NAME_SINGULAR}.
                <div className="mt-3">
                  <Link
                    legacyBehavior
                    href={CLUB_ROUTE()}
                    as={CLUB_ROUTE(club.code)}
                  >
                    <a className="button is-success is-light">
                      Back to {OBJECT_NAME_TITLE_SINGULAR}
                    </a>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="notification is-warning">
                <Icon name="alert-triangle" /> It doesn't look like you have
                finished the {OBJECT_NAME_SINGULAR} creation process for{' '}
                <b>{club?.name}</b>. We have saved what you have entered so far
                so that you can continue from where you left off.
              </div>
            ))}
          <Text>
            {SITE_NAME} is a central location for resources{' '}
            <b>directly associated with the {SCHOOL_NAME}</b> that are available
            to students at no cost. {SITE_NAME} is not a location to advertise
            outside resources. Only such resources will be approved for listing
            on {SITE_NAME}. If you're unsure if your resource can be listed on
            {SITE_NAME}, please email <Contact />.
          </Text>
          <Text>
            {OBJECT_NAME_TITLE} that you create from this form will enter an
            approval process before being displayed to the public. After your{' '}
            {OBJECT_NAME_SINGULAR} has been approved by {APPROVAL_AUTHORITY}, it
            will appear on the {SITE_NAME} website.
          </Text>
          <Text>
            Before creating your {OBJECT_NAME_SINGULAR}, please check to see if
            it already exists on the{' '}
            <Link href={DIRECTORY_ROUTE} as={DIRECTORY_ROUTE}>
              directory page
            </Link>
            . If your {OBJECT_NAME_SINGULAR} already exists on {SITE_NAME},
            please email <Contact /> to gain access instead of filling out this
            form.
          </Text>
          <div className="notification is-info mb-4">
            Student groups who would like to be listed are directed to{' '}
            <a rel="noopener noreferrer" target="_blank" href={CLUBS_HOME}>
              Penn Clubs
            </a>
            , a resource page specifically tailored for student organizations.
          </div>
        </>
      ),
    },
    {
      name: 'Basic',
      content: (): ReactElement => (
        <>
          <Title>{OBJECT_NAME_TITLE_SINGULAR} Information</Title>
          <Text>
            Use the form below to fill out basic information about your{' '}
            {OBJECT_NAME_SINGULAR}.
          </Text>
          <ClubEditCard
            isEdit={club !== null}
            schools={schools}
            years={years}
            majors={majors}
            tags={tags}
            club={club === null ? {} : club}
            studentTypes={studentTypes}
            onSubmit={({ message, club }): Promise<void> => {
              setClub(club ?? null)
              if (club) {
                message = `The initial information for this ${OBJECT_NAME_SINGULAR} has been saved. Continue with the steps below to finish the ${OBJECT_NAME_SINGULAR} creation process.`
              }
              setMessage(message)
              return Promise.resolve(undefined)
            }}
          />
          {message && (
            <div className="mb-3 mt-3 notification is-primary">{message}</div>
          )}
          <Line />
          <Subtitle>Points of Contact</Subtitle>
          <Text>
            You can specify the points of contact for your{' '}
            {OBJECT_NAME_SINGULAR} in the forms below. Public points of contact
            will be shown publicly on the website, while private points of
            contact will only be available to {SITE_NAME} administrators.
          </Text>
          {club !== null ? (
            <AdvisorCard validateAdvisors={validateAdvisors} club={club} />
          ) : (
            <Text>
              Fill out the form above before filling out this section.
            </Text>
          )}
          <Line />
          <Text>
            After you are finished with creating your {OBJECT_NAME_SINGULAR},
            press the continue button below to move on to the next step.
          </Text>
          {club === null || !advisorsValid ? (
            <>
              <Text>
                You still need to complete the following items on this page to
                continue:
              </Text>
              <div className="content" style={{ color: RED }}>
                <ul>
                  {club === null && (
                    <li>
                      Filling out and submitting the basic{' '}
                      {OBJECT_NAME_SINGULAR} information form.
                    </li>
                  )}
                  {!advisorsValid && (
                    <li>Filling out at least one public point of contact.</li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <Text>
              You have completed all required steps on this page. Press continue
              to move on to the next step.
            </Text>
          )}
          <Text>
            Your {OBJECT_NAME_SINGULAR} will not be submitted for approval until
            you complete all steps of the {OBJECT_NAME_SINGULAR} creation
            process.
          </Text>
        </>
      ),
      disabled: club === null || !advisorsValid,
    },
    {
      name: 'Details',
      content: (): ReactElement => (
        <>
          <Title>{OBJECT_NAME_TITLE_SINGULAR} Details</Title>
          <Text>
            You can fill out additional details that pertain to your{' '}
            {OBJECT_NAME_SINGULAR} using the form below. All of these fields are
            optional, but you should fill out the ones that are applicable to
            your {OBJECT_NAME_SINGULAR}.
          </Text>
          <Subtitle>Student Experiences</Subtitle>
          <Text>
            If you have any student experiences or testimonials, you can put
            them in the form below. These student experiences will be shown
            publicly on your {OBJECT_NAME_SINGULAR} page.
          </Text>
          {club !== null && <MemberExperiencesCard club={club} />}
          <Subtitle>Mailing List Features</Subtitle>
          <Text>
            You can enable or disable the subscription feature below. The
            subscription feature will allow you to view the emails of everyone
            who has clicked the subscribe (<Icon name="bell" />) button and add
            these emails to your mailing list.
          </Text>
          <Text>
            If you do not have a mailing list or do not plan on sending out any
            emails, please disable this feature.
          </Text>
          {club !== null && <EnableSubscriptionCard club={club} />}
          <Line />
          <Text>
            After you have saved the applicable forms, hit the continue button
            below to move on to the next step.
          </Text>
        </>
      ),
      disabled: club === null,
    },
    {
      name: 'Complete',
      content: (): ReactElement => (
        <>
          <Title>{OBJECT_NAME_TITLE_SINGULAR} Created</Title>
          <Text>
            <b className="has-text-success">Success!</b> Your{' '}
            {OBJECT_NAME_SINGULAR} has been created. This is what your{' '}
            {OBJECT_NAME_SINGULAR} will look like on the home page.
          </Text>
          <div className="mb-3">
            {club !== null && <ClubCard fullWidth club={club} />}
          </div>
          <Text>
            Your {OBJECT_NAME_SINGULAR} has been placed into the approval queue.
            Once your resource has been approved by {APPROVAL_AUTHORITY}, it
            will be shown publicly on {SITE_NAME}.
          </Text>
        </>
      ),
      onEnterTab: async () => {
        if (club !== null) {
          const resp = await doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body: {
              active: true,
            },
          })
          const data = await resp.json()
          setClub(data)
        }
      },
    },
  ]

  return (
    <Container
      background={SNOW}
      fullHeight
      style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}
    >
      {metadata}
      <Center>
        <InfoPageTitle>
          {isResuming ? 'Continue Creating' : 'Create a New'}{' '}
          {OBJECT_NAME_TITLE_SINGULAR}
        </InfoPageTitle>
        <FormProgressIndicator
          step={step}
          steps={steps}
          onStepClick={(newStep) => {
            if (newStep < step) {
              setStep(newStep)
            }
          }}
        />
      </Center>
      <div className="mt-5">{steps[step].content()}</div>
      <div className="has-text-right">
        {step < steps.length - 1 ? (
          <button
            onClick={() => {
              nextStep()
              window.scrollTo(0, 0)
            }}
            disabled={steps[step].disabled}
            className="button is-primary"
          >
            <Icon name="chevrons-right" />
            Continue
          </button>
        ) : (
          club !== null && (
            <Link
              href={CLUB_ROUTE()}
              as={CLUB_ROUTE(club.code)}
              className="button is-primary"
            >
              <Icon name="chevrons-right" />
              Continue to{OBJECT_NAME_TITLE_SINGULAR}
            </Link>
          )
        )}
      </div>
    </Container>
  )
}

export default ResourceCreationPage
