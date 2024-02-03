import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import React, { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { Icon, Modal, Text } from '~/components/common'
import Table from '~/components/common/Table'
import {
  computeWordCount,
  formatQuestionType,
} from '~/pages/club/[club]/application/[application]'
import {
  APPLICATION_STATUS_TYPES,
  ApplicationQuestionType,
  ApplicationResponse,
  ApplicationSubmission,
} from '~/types'
import { doApiRequest } from '~/utils'

const StyledResponses = styled.div`
  margin-bottom: 40px;
`
const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

const SubmissionModal = (props: {
  submission: ApplicationSubmission | null
}): ReactElement => {
  const { submission } = props
  const initialValues = {}
  const wordCounts = {}
  if (submission !== null) {
    submission.responses.forEach((response) => {
      switch (parseInt(response.question_type)) {
        case ApplicationQuestionType.FreeResponse:
          wordCounts[response.question.id] =
            response.text != null ? computeWordCount(response.text) : 0
          initialValues[response.question.id] = response.text
          break
        case ApplicationQuestionType.ShortAnswer:
          initialValues[response.question.id] = response.text
          break
        case ApplicationQuestionType.MultipleChoice:
          initialValues[response.question.id] =
            response.multiple_choice !== null
              ? response.multiple_choice.value
              : null
          break
        default:
          break
      }
    })
  }

  return (
    <ModalContainer>
      <Formik
        initialValues={initialValues}
        onSubmit={() => {
          // pass
        }}
      >
        {(props) => (
          <Form>
            {submission !== null && submission.responses !== null
              ? submission.responses.map((response: ApplicationResponse) => {
                  const input = formatQuestionType(
                    null,
                    response.question,
                    wordCounts,
                    () => {
                      // pass
                    },
                    true,
                  )
                  return (
                    <div>
                      {input}
                      <br></br>
                    </div>
                  )
                })
              : null}
          </Form>
        )}
      </Formik>
    </ModalContainer>
  )
}

function formatSubmissions(responses) {
  return responses.map((response) => {
    return {
      ...response,
      name: response.name ?? '(removed)',
      club: response.club ?? '(removed)',
      committee: response.committee?.name ?? 'General Member',
      status: APPLICATION_STATUS_TYPES.find(
        (status) => status.value === response.status,
      )?.label,
      created_at: moment(response.created_at)
        .tz('America/New_York')
        .format('LLL'),
    }
  })
}

function SubmissionsPage({
  initialSubmissions,
}: {
  initialSubmissions: Array<ApplicationSubmission> | { detail: string }
}): ReactElement {
  if ('detail' in initialSubmissions) {
    return <Text>{initialSubmissions.detail}</Text>
  }

  const [submissions, setSubmissions] = useState<Array<ApplicationSubmission>>(
    formatSubmissions(initialSubmissions),
  )
  const [showModal, setShowModal] = useState<boolean>(false)
  const [
    currentSubmission,
    setCurrentSubmission,
  ] = useState<ApplicationSubmission | null>(null)

  const responseTableFields = [
    { label: 'Application', name: 'name' },
    { label: 'Committee', name: 'committee' },
    { label: 'Submitted', name: 'created_at' },
    { label: 'Club', name: 'club' },
    {
      name: 'application_link',
      label: 'Link',
      render: (id) => {
        const submission = submissions.find(
          (submission) => submission.pk === id,
        )
        return submission != null ? (
          <>
            <a href={submission.application_link}>
              <button
                onClick={(e) => e.stopPropagation()}
                className="button is-primary is-small ml-3"
              >
                <Icon name="edit" />
                Edit
              </button>
            </a>
          </>
        ) : null
      },
    },
    {
      name: 'delete',
      label: 'Delete',
      render: (id) => {
        const submission = submissions.find(
          (submission) => submission.pk === id,
        )
        return submission != null ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (
                confirm(
                  'Are you sure you want to permanently delete this submission?',
                )
              ) {
                doApiRequest(`/submissions/${submission.pk}/?format=json`, {
                  method: 'DELETE',
                })
                setSubmissions(
                  submissions.filter((submission) => submission.pk !== id),
                )
              }
            }}
            className="button is-danger is-small ml-3"
          >
            <Icon name="trash" alt="delete" />
            Delete
          </button>
        ) : null
      },
    },
  ]

  useEffect(() => {
    if (submissions !== null && submissions.length === 0) {
      doApiRequest(`/submissions/?format=json`, {
        method: 'GET',
      })
        .then((resp) => resp.json())
        .then((responses) => setSubmissions(formatSubmissions(responses)))
    }
  }, [])

  return (
    <>
      <Text>
        On this page you can view your submitted applications. Click on any
        application to view your submission. If there is something you would
        like to change, just click edit and resubmit to update your submission.
      </Text>
      <StyledResponses>
        <Table
          data={submissions.map((item, index) =>
            item.pk ? { ...item, id: item.pk } : { ...item, id: index },
          )}
          columns={responseTableFields}
          searchableColumns={['name']}
          filterOptions={[]}
          focusable={true}
          onClick={(row) => {
            setShowModal(true)
            const submission =
              submissions.find(
                (submission) => submission.pk === row.original.pk,
              ) ?? null
            setCurrentSubmission(submission)
          }}
        />
      </StyledResponses>
      {showModal && (
        <Modal
          show={showModal}
          closeModal={() => setShowModal(false)}
          width="80%"
          marginBottom={false}
        >
          <SubmissionModal submission={currentSubmission} />
        </Modal>
      )}
    </>
  )
}

export default SubmissionsPage
