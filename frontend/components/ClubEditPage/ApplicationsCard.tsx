import { Field } from 'formik'
import React, { ReactElement, useState } from 'react'
import styled from 'styled-components'

import {
  ApplicationQuestionType,
  Club,
  ClubApplicationRequired,
} from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon, Modal, Text } from '../common'
import {
  ApplicationMultipleChoiceField,
  DateTimeField,
  SelectField,
  TextField,
} from '../FormComponents'
import ModelForm from '../ModelForm'
import BaseCard from './BaseCard'

type Props = {
  club: Club
}
const QUESTION_TYPES = [
  {
    value: ApplicationQuestionType.FreeResponse,
    label: 'Free Response',
  },
  {
    value: ApplicationQuestionType.MultipleChoice,
    label: 'Multiple Choice',
  },
  {
    value: ApplicationQuestionType.ShortAnswer,
    label: 'Short Answer',
  },
  {
    value: ApplicationQuestionType.CommitteeQuestion,
    label: 'Committee Question',
  },
]

const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

const ApplicationModal = (props: {
  clubCode: string
  applicationName: string
  showDetailsButton?: boolean
  onLinkClicked?: () => void
  committeeChoices: Array<{ label: string; value: string }>
}): ReactElement => {
  const {
    clubCode,
    applicationName,
    showDetailsButton,
    onLinkClicked,
    committeeChoices,
  } = props
  // TODO: I'm positive that this is something that Formik should do for me
  const [
    questionType,
    setQuestionType,
  ] = useState<ApplicationQuestionType | null>()
  const [multipleChoices, setMultipleChoices] = useState<
    [{ label: string; value: string }]
  >()
  const [committees, setCommittees] = useState<
    [{ label: string; value: string }]
  >()

  return (
    <ModalContainer>
      <ModelForm
        baseUrl={`/clubs/${clubCode}/applications/${applicationName}/questions/`}
        defaultObject={{ name: `${applicationName} Question` }}
        fields={
          <>
            <Field name="prompt" as={TextField} required={true} />
            <Field
              name="question_type"
              as={SelectField}
              choices={QUESTION_TYPES}
              required={true}
              valueDeserialize={(a: ApplicationQuestionType) =>
                QUESTION_TYPES.find((x) => x.value === a)
              }
              serialize={(a: { value: ApplicationQuestionType }) => a.value}
            />
            {questionType !== null &&
              questionType === ApplicationQuestionType.FreeResponse && (
                <Field name="word_limit" as={TextField} type={'number'} />
              )}
            {questionType !== null &&
              questionType === ApplicationQuestionType.MultipleChoice && (
                <Field
                  name="multiple_choice"
                  as={ApplicationMultipleChoiceField}
                  initialValues={multipleChoices}
                />
              )}
            {questionType !== null &&
              questionType === ApplicationQuestionType.CommitteeQuestion && (
                <Field
                  name="committees"
                  as={SelectField}
                  initialValues={committees}
                  choices={committeeChoices}
                  isMulti={true}
                />
              )}
          </>
        }
        tableFields={[{ name: 'prompt', label: 'Prompt' }]}
        noun="Application"
        onChange={(value) => {
          setQuestionType(value.question_type)
          if (
            value.multiple_choice !== null &&
            value.multiple_choice !== undefined
          ) {
            setMultipleChoices(
              value.multiple_choice.map((item: { value: string }) => {
                return {
                  value: item.value,
                  label: item.value,
                }
              }),
            )
          }

          if (value.committees !== null && value.committees !== undefined) {
            setCommittees(
              value.committees.map((item) => {
                const value = item.name ?? item.value
                return {
                  label: value,
                  value,
                }
              }),
            )
          }
        }}
      />
    </ModalContainer>
  )
}

export default function ApplicationsCard({ club }: Props): ReactElement {
  const [show, setShow] = useState(false)
  const showModal = () => setShow(true)
  const hideModal = () => setShow(false)
  const [applicationName, setApplicationName] = useState('')
  const [committees, setCommittees] = useState<{
    label: string
    value: string
  } | null>(null)
  const [committeeChoices, setCommitteeChoices] = useState<{
    id?: Array<{
      label: string
      value: string
    }>
  } | null>(null)

  return (
    <BaseCard title={`${OBJECT_NAME_TITLE_SINGULAR} Applications`}>
      {club.application_required === ClubApplicationRequired.Open && (
        <div className="notification is-warning">
          <Icon name="alert-triangle" /> Your {OBJECT_NAME_SINGULAR} currently
          has it application status set to open membership. Adding{' '}
          {OBJECT_NAME_SINGULAR} applications here will have no effect on what
          the student sees.
        </div>
      )}
      <Text>
        You can use the interface below to add {OBJECT_NAME_SINGULAR}{' '}
        applications.
      </Text>
      <ul className="mb-3">
        {[
          <>
            Display your application links in a centralized repository of{' '}
            {OBJECT_NAME_SINGULAR} applications. While your{' '}
            {OBJECT_NAME_SINGULAR} has an open application, it will be
            prioritized in {OBJECT_NAME_SINGULAR} listings.
          </>,
          <>
            Subscribed students will automatically receive email reminders about
            application deadlines three days before the application is due.
          </>,
          <>
            Automatically update membership and recruiting statuses based on
            when your applications open and close. When your application opens,
            we will mark your {OBJECT_NAME_SINGULAR} as accepting members. When
            it closes, we will mark your {OBJECT_NAME_SINGULAR} as not accepting
            members.
          </>,
        ].map((text, i) => (
          <li key={i}>
            <span className=" ml-3 has-text-success">
              <Icon name="check" />
            </span>{' '}
            {text}
          </li>
        ))}
      </ul>
      <ModelForm
        baseUrl={`/clubs/${club.code}/applications/`}
        defaultObject={{ name: `${club.name} Application` }}
        onChange={(data) => {
          setCommittees(
            data?.committees.map((item) => {
              const value = item.name ?? item.value
              return { label: value, value }
            }),
          )
        }}
        onUpdate={(applications) => {
          const committeeChoicesProps: {
            id?: Array<{
              label: string
              value: string
            }>
          } = {}
          applications.forEach((application) => {
            const id = application.id
            committeeChoicesProps[id] =
              application.committees === null
                ? null
                : application.committees.map((committee) => {
                    return { label: committee.name, value: committee.name }
                  })
          })
          setCommitteeChoices(committeeChoicesProps)
        }}
        fields={
          <>
            <Field
              name="name"
              as={TextField}
              helpText="A name for this application, used for identifying it if you have multiple applications per semester."
            />
            <Field
              name="application_start_time"
              as={DateTimeField}
              required={true}
              helpText="The date when your application opens."
            />
            <Field
              name="application_end_time"
              as={DateTimeField}
              required={true}
              helpText="The date when your application closes."
            />
            <Field
              name="result_release_time"
              as={DateTimeField}
              required={true}
              helpText={`The latest date that your ${OBJECT_NAME_SINGULAR} will be releasing admission results.`}
            />
            <Field
              name="external_url"
              as={TextField}
              type="url"
              helpText={`The external URL where students can apply for your ${OBJECT_NAME_SINGULAR}.`}
            />
            <Field
              name="committees"
              as={ApplicationMultipleChoiceField}
              initialValues={committees}
              helpText={`If your club has multiple committees to which students can apply, list them here.`}
            />
          </>
        }
        tableFields={[
          { name: 'name', label: 'Name' },
          {
            name: 'id',
            label: 'Edit',
            render: (id) => {
              setApplicationName(id)
              return (
                <>
                  <button
                    className="button is-primary is-small"
                    onClick={showModal}
                  >
                    Questions
                  </button>
                  <a href={`/club/${club.code}/application/${id}`}>
                    <button className="button is-primary is-small ml-3">
                      Preview
                    </button>
                  </a>
                </>
              )
            },
          },
        ]}
        noun="Application"
      />
      {show && (
        <Modal
          show={show}
          closeModal={hideModal}
          width="80%"
          marginBottom={false}
        >
          <ApplicationModal
            clubCode={club.code}
            applicationName={applicationName}
            showDetailsButton={false}
            committeeChoices={
              committeeChoices !== null &&
              committeeChoices[applicationName] !== null
                ? committeeChoices[applicationName]
                : null
            }
          />
        </Modal>
      )}
    </BaseCard>
  )
}
