import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import React, { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import {
  ALLBIRDS_GRAY,
  ANIMATION_DURATION,
  BORDER_RADIUS,
  CLUBS_BLUE,
  HOVER_GRAY,
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
import { ApplicationQuestion, ApplicationQuestionType } from '~/types'
import { doApiRequest } from '~/utils'

import { Modal } from '../common'
import { Icon } from '../common/Icon'
import Table from '../common/Table'
import Toggle from '../Settings/Toggle'

const StyledResponses = styled.div`
  margin-bottom: 40px;
`

const FormsCard = styled.div<CardProps>`
  padding: 0px;
  box-shadow: 0 0 0 transparent;
  transition: all ${ANIMATION_DURATION}ms ease;
  border-radius: ${BORDER_RADIUS};
  box-shadow: 0 0 0 ${WHITE};
  background-color: ${({ hovering }) => (hovering ? HOVER_GRAY : WHITE)};
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

const GeneralSettings = () => {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100' }}>
        <span>Collect Email Addresses</span>
        <div style={{ marginLeft: 'auto' }}>
          <Toggle club={null} active={true} toggle={() => {}} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row', width: '100' }}>
        <span>Allow edit after submissions</span>
        <div style={{ marginLeft: 'auto' }}>
          <Toggle club={null} active={true} toggle={() => {}} />
        </div>
      </div>
    </div>
  )
}

const SharingSettings = () => {
  return <div>Sharing</div>
}

const AdvancedSettings = () => {
  return <div>Advanced</div>
}

const tabs = [
  {
    name: 'General',
    content: <GeneralSettings />,
  },
  { name: 'Sharing', content: <SharingSettings /> },
  { name: 'Advanced', content: <AdvancedSettings /> },
]

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

const forms = []

type Application = {
  id: number
  name: string
}

enum ApplicationStatusType {
  Pending = 1,
  FirstRound = 2,
  SecondRound = 3,
  Accepted = 4,
  Rejected = 5,
}

const APPLICATION_STATUS_TYPES = [
  {
    value: ApplicationStatusType.Pending,
    label: 'Pending',
  },
  {
    value: ApplicationStatusType.FirstRound,
    label: 'First round',
  },
  {
    value: ApplicationStatusType.SecondRound,
    label: 'Second round',
  },
  {
    value: ApplicationStatusType.Accepted,
    label: 'Accepted',
  },
  {
    value: ApplicationStatusType.Rejected,
    label: 'Rejected',
  },
]

type Submission = {
  application: number
  committee: string | null
  created_at: string
  pk: number
  status: string
  responses: Array<Response>
}

type Response = {
  text: string | null
  multiple_choice: {
    value: string
  }
  question_type: string
  question: ApplicationQuestion
}

const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
`

const SubmissionModal = (props: {
  club: string
  application: Application
  submission: Submission
  onLinkClicked?: () => void
}): ReactElement => {
  const { submission } = props
  const initialValues = {}
  const wordCounts = {}
  submission.responses.forEach((response) => {
    switch (parseInt(response.question_type)) {
      case ApplicationQuestionType.FreeResponse:
        wordCounts[response.question.id] =
          response.text != null ? computeWordCount(response.text) : 0
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
  return (
    <ModalContainer>
      <Formik initialValues={initialValues}>
        {(props) => (
          <Form>
            {submission.responses !== null
              ? submission.responses.map((response: Response) => {
                  const input = formatQuestionType(
                    null,
                    response.question,
                    wordCounts,
                    () => {},
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

const ApplicationsPage = ({ club }: { club: Club }) => {
  const responseTableFields = [
    { label: 'User Id', name: 'user_hash' },
    { label: 'Committee', name: 'committee' },
    { label: 'Submitted', name: 'created_at' },
    { label: 'Status', name: 'status' },
    // {
    //   label: 'Status',
    //   name: 'status',
    //   render: (_, index) => (
    //     <span
    //       className={`tag is-${
    //         responses[index].status === 'rejected'
    //           ? 'danger'
    //           : responses[index].status === 'accepted'
    //           ? 'success'
    //           : 'info'
    //       }  is-light`}
    //     >
    //       {responses[index].status}
    //     </span>
    //   ),
    // },
    // { label: 'Submitted', name: 'submitted' },
    // { label: 'Actions', name: 'actions' },
  ]

  const [applications, setApplications] = useState<Array<Application>>([])
  const [
    currentApplication,
    setCurrentApplication,
  ] = useState<Application | null>(null)
  const [submissions, setSubmissions] = useState<Array<Submission>>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(
    null,
  )

  useEffect(async () => {
    const applications = await doApiRequest(
      `/clubs/${club.code}/applications/?format=json`,
      {
        method: 'GET',
      },
    ).then((resp) => resp.json())
    if (applications.length !== 0) {
      setApplications(applications)
      setCurrentApplication(applications[0])
    }
  }, [])

  useEffect(async () => {
    if (currentApplication !== null) {
      const responses = (
        await doApiRequest(
          `/clubs/${club.code}/applications/${currentApplication.id}/submissions/?format=json`,
          {
            method: 'GET',
          },
        ).then((resp) => resp.json())
      ).map((response) => {
        return {
          ...response,
          committee: response.committee?.name ?? 'N/A',
          status: APPLICATION_STATUS_TYPES.find(
            (status) => status.value === response.status,
          )?.label,
          created_at: moment(response.created_at)
            .tz('America/New_York')
            .format('LLL'),
        }
      })
      setSubmissions(responses)
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
        <StyledHeader className="is-pulled-left">Applications</StyledHeader>
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
              item.id ? item : { ...item, id: index },
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
            showDetailsButton={false}
          />
        </Modal>
      )}
    </div>
  )
}

export default ApplicationsPage
