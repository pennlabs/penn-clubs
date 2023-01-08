import { Field } from 'formik'
import React, { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { doApiRequest } from '~/utils'

import { ApplicationQuestionType, Club } from '../../types'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
} from '../../utils/branding'
import { Icon, Modal, Text } from '../common'
import {
  ApplicationUpdateTextField,
  CheckboxField,
  CreatableMultipleSelectField,
  DateTimeField,
  RichTextField,
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
    label: 'Short Answer (Non-evaluative)',
  },
  {
    value: ApplicationQuestionType.InfoText,
    label: 'Informational Text',
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
  const [committeeQuestion, setCommitteeQuestion] = useState<boolean>()

  const validateWordCount = (value) => {
    let errorMsg
    if (+value > 500) {
      errorMsg = 'Please enter a valid word count'
    }
    return errorMsg
  }

  return (
    <ModalContainer>
      <ModelForm
        baseUrl={`/clubs/${clubCode}/applications/${applicationName}/questions/`}
        defaultObject={{ name: `${applicationName} Question` }}
        draggable={true}
        fields={
          <>
            <Field
              name="question_type"
              as={SelectField}
              choices={QUESTION_TYPES}
              required={true}
              helpText={'Type of question on the application.'}
              valueDeserialize={(a: ApplicationQuestionType) =>
                QUESTION_TYPES.find((x) => x.value === a)
              }
              serialize={(a: { value: ApplicationQuestionType }) => a.value}
            />
            <Field
              name="prompt"
              as={TextField}
              required={true}
              helpText={'Prompt for this question on the application'}
            />
            {questionType !== null &&
              questionType === ApplicationQuestionType.FreeResponse && (
                <Field
                  name="word_limit"
                  as={TextField}
                  type={'number'}
                  helpText={
                    'Word limit for this free response question (maximum total per committee is 500)'
                  }
                />
              )}
            {questionType !== null &&
              questionType === ApplicationQuestionType.MultipleChoice && (
                <Field
                  name="multiple_choice"
                  as={CreatableMultipleSelectField}
                  initialValues={multipleChoices}
                  helpText={
                    'Multiple choice options for this multiple choice question'
                  }
                />
              )}
            <Field
              name="committee_question"
              as={CheckboxField}
              initialValues={committeeQuestion}
              label={
                'Do you want this question to appear only for certain committees?'
              }
            />
            {questionType !== null && committeeQuestion && (
              <Field
                name="committees"
                as={SelectField}
                initialValues={committees}
                choices={committeeChoices}
                isMulti={true}
                helpText={
                  'Select the committees for which this question should appear'
                }
              />
            )}
          </>
        }
        tableFields={[{ name: 'prompt', label: 'Prompt' }]}
        noun="Application"
        onUpdate={(questions) => {
          const body = { precedence: questions.map((question) => question.id) }
          doApiRequest(
            `/clubs/${clubCode}/applications/${applicationName}/questions/precedence/?format=json`,
            {
              method: 'POST',
              body,
            },
          )
        }}
        onChange={(value) => {
          setQuestionType(value.question_type)
          setCommitteeQuestion(value.committee_question)
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

  function duplicateApplicationCurrent(id, obj) {
    if (
      confirm(
        `Are you sure you want to duplicate the selected application? Please refresh the page after you select OK`,
      )
    ) {
      doApiRequest(`/clubs/${club.code}/applications/${id}/duplicate/`, {
        method: 'POST',
        body: {},
      })
    }
  }

  return (
    <BaseCard title={`${OBJECT_NAME_TITLE_SINGULAR} Applications`}>
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

      {!club.is_wharton && (
        <Text>
          <b>TIP</b>: To copy over your application from last semester, please
          click <b> duplicate </b> on the application from the season that you
          would like to copy over and refresh the page. You can then edit this
          application as you please.
        </Text>
      )}

      <Text>
        If your club is affiliated with the Wharton Council Centralised
        Application, please note that editable applications will be provisioned
        by the system administrator.{' '}
      </Text>

      <ModelForm
        allowCreation={!club.is_wharton}
        baseUrl={`/clubs/${club.code}/applications/`}
        defaultObject={{ name: `${club.name} Application` }}
        onChange={(data) => {
          if (data.committees != null) {
            setCommittees(
              data.committees.map((item) => {
                const value = item.name ?? item.value
                return { label: value, value }
              }),
            )
          }
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
              name="description"
              as={RichTextField}
              helpText="Information about the application that will be displayed at the top of the application page."
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
              as={CreatableMultipleSelectField}
              initialValues={committees}
              helpText={`If your ${OBJECT_NAME_SINGULAR} has multiple committees to which students can apply, list them here. NOTE: you won't be able to edit this field after applications open.`}
            />
            <Field
              name="acceptance_email"
              as={ApplicationUpdateTextField}
              initialValues={
                "<html> <body> <p> Congratulations {{name}}! You've been accepted because {{reason}}! </p> </body> </html>"
              }
              helpText={`Acceptance email for your ${OBJECT_NAME_SINGULAR}.`}
            />
            <Field
              name="rejection_email"
              as={ApplicationUpdateTextField}
              initialValues={
                "<html> <body> <p> Congratulations {{name}}! You've been rejected because {{reason}}! </p> </body> </html>"
              }
              helpText={`Rejection email for your ${OBJECT_NAME_SINGULAR}.`}
            />
          </>
        }
        confirmDeletion={true}
        tableFields={[
          { name: 'name', label: 'Name' },
          { name: 'cycle', label: 'Cycle' },
          {
            name: 'id',
            label: 'Edit',
            converter: (id, object) => {
              return (
                <>
                  {object.active ? (
                    <button
                      className="button is-primary is-small"
                      onClick={() => {
                        setApplicationName(id)
                        showModal()
                      }}
                    >
                      Questions
                    </button>
                  ) : (
                    !club.is_wharton && (
                      <button
                        className="button is-primary is-small"
                        onClick={() => {
                          duplicateApplicationCurrent(id, 1)
                        }}
                      >
                        Duplicate
                      </button>
                    )
                  )}
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
