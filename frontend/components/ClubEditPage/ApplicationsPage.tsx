import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CLUBS_BLUE,
  MD,
  mediaMaxWidth,
  SM,
  SNOW,
  WHITE,
} from '~/constants'
import {
  computeWordCount,
  formatQuestionType,
} from '~/pages/club/[club]/application/[application]'
import {
  APPLICATION_STATUS_TYPES,
  ApplicationQuestionType,
  ApplicationResponse,
  ApplicationSubmission,
  Club,
} from '~/types'
import { doApiRequest } from '~/utils'

import { Modal } from '../common'
import { Icon } from '../common/Icon'
import Table from '../common/Table'

const StyledResponses = styled.div`
  margin-bottom: 40px;
`

const FormsCard = styled.div`
  padding: 0px;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  border: 1px solid ${ALLBIRDS_GRAY};
  justify-content: space-between;
  height: 65vh;

  ${mediaMaxWidth(SM)} {
    width: calc(100%);
    padding: 8px;
  }
`

const FormsCardWrapper = styled.div`
  position: relative;
  margin-top: 40px;
  ${mediaMaxWidth(SM)} {
    padding-top: 0;
    padding-bottom: 1rem;
  }
`

const StyledHeader = styled.div.attrs({ className: 'is-clearfix' })`
  margin-bottom: 20px;
  color: ${CLUBS_BLUE};
  font-size: 18px;
  & > .info {
    float: left;
  }
  .tools {
    float: right;
    margin: 0;
    margin-left: auto;
    & > div {
      margin-left: 20px;
      display: inline-block;
    }
  }

  ${mediaMaxWidth(MD)} {
    .tools {
      margin-top: 20px;
    }
  }
`

const FormWrapper = styled.div`
  border-bottom: 1px solid ${ALLBIRDS_GRAY};
  height: 50px;
  padding: 12px;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    background-color: ${SNOW};
  }
`

const SubmissionSelect = (props: any) => {
  const { application, setApplication } = props
  return (
    <FormWrapper onClick={() => setApplication(application)}>
      {application.name}
      <span className="is-pulled-right">
        <Icon
          name="user"
          alt="members"
          size="1.2rem"
          style={{ marginRight: '8px' }}
        />
        {/* TODO: implement applicants number <span style={{ marginRight: '20px' }}>{application.applicantsNumber}</span> */}
        <Icon name="chevron-right" />
      </span>
    </FormWrapper>
  )
}

type Application = {
  id: number
  name: string
}

const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

const SubmissionModal = (props: {
  club: string
  application: Application | null
  submission: ApplicationSubmission | null
  onLinkClicked?: () => void
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

export default function ApplicationsPage({
  club,
}: {
  club: Club
}): ReactElement {
  const responseTableFields = [
    { label: 'User Id', name: 'user_hash' },
    { label: 'Committee', name: 'committee' },
    { label: 'Submitted', name: 'created_at' },
    { label: 'Status', name: 'status' },
  ]

  const [applications, setApplications] = useState<Array<Application>>([])
  const [
    currentApplication,
    setCurrentApplication,
  ] = useState<Application | null>(null)
  const [submissions, setSubmissions] = useState<Array<ApplicationSubmission>>(
    [],
  )
  const [showModal, setShowModal] = useState<boolean>(false)
  const [
    currentSubmission,
    setCurrentSubmission,
  ] = useState<ApplicationSubmission | null>(null)

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/applications/?format=json`, {
      method: 'GET',
    })
      .then((resp) => resp.json())
      .then((applications) => {
        if (applications.length !== 0) {
          setApplications(applications)
          setCurrentApplication(applications[0])
        }
      })
  }, [])

  useEffect(() => {
    if (currentApplication !== null) {
      doApiRequest(
        `/clubs/${club.code}/applications/${currentApplication.id}/submissions/?format=json`,
        {
          method: 'GET',
        },
      )
        .then((resp) => resp.json())
        .then((responses) => {
          return responses.map((response) => {
            return {
              ...response,
              committee: response.committee?.name ?? 'General Member',
              status: APPLICATION_STATUS_TYPES.find(
                (status) => status.value === response.status,
              )?.label,
              created_at: moment(response.created_at)
                .tz('America/New_York')
                .format('LLL'),
            }
          })
        })
        .then((responses) => setSubmissions(responses))
    }
  }, [currentApplication])

  const columns = useMemo(
    () =>
      responseTableFields.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [responseTableFields],
  )

  return (
    <div className="columns">
      <div className="column is-one-third" style={{ marginRight: '100px' }}>
        <StyledHeader>Applications</StyledHeader>
        <FormsCardWrapper>
          <FormsCard className="card">
            {applications.map((application) => (
              <SubmissionSelect
                application={application}
                setApplication={setCurrentApplication}
              />
            ))}
          </FormsCard>
        </FormsCardWrapper>
      </div>
      <div className="column is-two-thirds">
        <StyledResponses>
          <StyledHeader style={{ marginBottom: '2px' }}>Responses</StyledHeader>
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
      </div>
      {showModal && (
        <Modal
          show={showModal}
          closeModal={() => setShowModal(false)}
          width="80%"
          marginBottom={false}
        >
          <SubmissionModal
            club={club.code}
            application={currentApplication}
            submission={currentSubmission}
          />
        </Modal>
      )}
    </div>
  )
}
