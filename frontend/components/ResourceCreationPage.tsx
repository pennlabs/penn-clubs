import Link from 'next/link'
import React, { ReactElement, useState } from 'react'

import { CLUB_ROUTE, DIRECTORY_ROUTE, SNOW } from '../constants'
import { Club, Major, School, StudentType, Tag, Year } from '../types'
import { doApiRequest } from '../utils'
import {
  APPROVAL_AUTHORITY,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from '../utils/branding'
import ClubCard from './ClubCard'
import ClubEditCard from './ClubEditPage/ClubEditCard'
import FormProgressIndicator from './ClubEditPage/FormProgressIndicator'
import {
  Center,
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Line,
  Loading,
  Metadata,
  Text,
  Title,
} from './common'
import AuthPrompt from './common/AuthPrompt'

type ResourceCreationPageProps = {
  authenticated: boolean | null
  schools: School[]
  years: Year[]
  majors: Major[]
  tags: Tag[]
  student_types: StudentType[]
}

type TabItem = {
  name: string
  content: () => ReactElement
  disabled?: boolean
  onEnterTab?: () => Promise<void>
}

const ResourceCreationPage = ({
  authenticated,
  schools,
  years,
  majors,
  tags,
  student_types,
}: ResourceCreationPageProps): ReactElement => {
  const metadata = <Metadata title={`Create ${OBJECT_NAME_TITLE_SINGULAR}`} />
  const [step, setStep] = useState<number>(0)
  const [club, setClub] = useState<Club | null>(null)
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
              <a>directory page</a>
            </Link>
            . If your {OBJECT_NAME_SINGULAR} already exists, please email{' '}
            <Contact /> to gain access instead of filling out this form.
          </Text>
        </>
      ),
    },
    {
      name: `${OBJECT_NAME_TITLE_SINGULAR} Info`,
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
            student_types={student_types}
            onSubmit={({ message, club }): Promise<void> => {
              setClub(club ?? null)
              setMessage(message)
              return Promise.resolve(undefined)
            }}
          />
          {message && (
            <div className="mb-3 mt-3 notification is-primary">{message}</div>
          )}
          <Line />
          <Text>
            After you are finished with creating your {OBJECT_NAME_SINGULAR},
            press the continue button below to move on to the next step.
          </Text>
          <Text>
            Your {OBJECT_NAME_SINGULAR} will not be submitted for approval until
            you complete all steps of the {OBJECT_NAME_SINGULAR} creation
            process.
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
            {OBJECT_NAME_SINGULAR} has been created! This is what your{' '}
            {OBJECT_NAME_SINGULAR} will look like on the home page.
          </Text>
          <div className="mb-3">
            {club !== null && <ClubCard club={club} />}
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
    <Container background={SNOW} fullHeight>
      {metadata}
      <Center>
        <InfoPageTitle>Create a New {OBJECT_NAME_TITLE_SINGULAR}</InfoPageTitle>
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
            onClick={nextStep}
            disabled={steps[step].disabled}
            className="button is-primary"
          >
            <Icon name="chevrons-right" />
            Continue
          </button>
        ) : (
          club !== null && (
            <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
              <a className="button is-primary">
                <Icon name="chevrons-right" />
                Continue to {OBJECT_NAME_TITLE_SINGULAR}
              </a>
            </Link>
          )
        )}
      </div>
    </Container>
  )
}

export default ResourceCreationPage
