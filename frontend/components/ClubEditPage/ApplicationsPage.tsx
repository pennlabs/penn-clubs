import { Form, Formik } from 'formik'
import moment from 'moment-timezone'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import styled from 'styled-components'

import { ALLBIRDS_GRAY, CLUBS_BLUE, MD, mediaMaxWidth, SNOW } from '~/constants'
import {
  computeWordCount,
  formatQuestionType,
} from '~/pages/club/[club]/application/[application]'
import {
  APPLICATION_STATUS_TYPES,
  ApplicationQuestionType,
  ApplicationResponse,
  ApplicationStatusType,
  ApplicationSubmission,
  Club,
} from '~/types'
import { doApiRequest, getApiUrl } from '~/utils'

import { Checkbox, Loading, Modal, Text } from '../common'
import { Icon } from '../common/Icon'
import Table from '../common/Table'

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
  padding: 12px;
  cursor: pointer;

  &:hover,
  &:active,
  &:focus {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    background-color: ${SNOW};
  }
`

export const APPLICATION_STATUS: Array<{ value: number; label: string }> = [
  {
    value: ApplicationStatusType.Pending,
    label: 'Pending',
  },
  {
    value: ApplicationStatusType.Accepted,
    label: 'Accepted',
  },
  {
    value: ApplicationStatusType.RejectedWritten,
    label: 'Rejected after interview(s)',
  },
  {
    value: ApplicationStatusType.RejectedInterview,
    label: 'Rejected after written application',
  },
]

const SubmissionSelect = (props: any) => {
  const { application, setApplication } = props
  return (
    <FormWrapper onClick={() => setApplication(application)}>
      {application.name}
      <span className="is-pulled-right">
        <Icon name="user" alt="members" style={{ marginRight: '8px' }} />
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
  const [applications, setApplications] = useState<Array<Application>>([])
  const [
    currentApplication,
    setCurrentApplication,
  ] = useState<Application | null>(null)
  const [submissions, setSubmissions] = useState<{
    [key: number]: Array<ApplicationSubmission>
  }>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [
    currentSubmission,
    setCurrentSubmission,
  ] = useState<ApplicationSubmission | null>(null)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [statusToggle, setStatusToggle] = useState<boolean>(false)

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
    if (applications !== null) {
      const newSubmissions = {}
      const fetches = applications.map((application) => {
        return doApiRequest(
          `/clubs/${club.code}/applications/${application.id}/submissions/?format=json`,
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
          .then((responses) => {
            newSubmissions[application.id] = responses
          })
      })
      Promise.all(fetches).then(() => setSubmissions(newSubmissions))
    }
  }, [applications])

  const [selectedSubmissions, setSelectedSubmissions] = useState<Array<number>>(
    [],
  )
  const [status, setStatus] = useState<ApplicationStatusType>(
    ApplicationStatusType.Pending,
  )

  const responseTableFields = [
    {
      label: 'Select',
      render: (id) => (
        <Checkbox
          size={'1.3rem'}
          className="mr-3"
          checked={selectedSubmissions.includes(id)}
          onChange={(e) => {
            setSelectedSubmissions(
              selectedSubmissions.includes(id)
                ? selectedSubmissions.filter((key) => key !== id)
                : [...selectedSubmissions, id],
            )
          }}
        />
      ),
    },
    { label: 'First Name', name: 'first_name' },
    { label: 'Last Name', name: 'last_name' },
    { label: 'Email', name: 'email' },
    { label: 'Graduation Year', name: 'graduation_year' },
    { label: 'Committee', name: 'committee' },
    { label: 'Submitted', name: 'created_at' },
    { label: 'Status', name: 'status' },
  ]

  const columns = useMemo(
    () =>
      responseTableFields.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [responseTableFields],
  )

  return (
    <>
      <StyledHeader style={{ marginBottom: '2px' }}>Applications</StyledHeader>
      <Text>
        Select an application here and responses will populate below! Click on
        any response to see the entire application. You can also download to
        CSV.
      </Text>
      <Select
        options={applications.map((application) => {
          return { value: application.id, label: application.name }
        })}
        value={
          currentApplication != null
            ? {
                value: currentApplication.id,
                label: currentApplication.name,
              }
            : null
        }
        onChange={(v: { value: number; label: string } | null) =>
          v != null &&
          setCurrentApplication({
            id: v.value,
            name: v.label,
          })
        }
      />
      <br></br>
      <div>
        {currentApplication != null ? (
          submissions[currentApplication.id] != null ? (
            <>
              <StyledHeader style={{ marginBottom: '2px' }}>
                Responses
              </StyledHeader>
              <div>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <div className="mr-3" style={{ width: '70%' }}>
                    <Select
                      options={APPLICATION_STATUS}
                      onChange={(val) => val != null && setStatus(val.value)}
                    />
                  </div>
                  <button
                    className="button is-success mr-3"
                    onClick={() => {
                      if (submissions[currentApplication.id] != null) {
                        const obj = {}
                        obj[currentApplication.id] =
                          submissions[currentApplication.id]
                        obj[currentApplication.id].forEach((submission) => {
                          if (
                            selectedSubmissions.indexOf(submission.pk) !== -1
                          ) {
                            const newStatus = APPLICATION_STATUS.find(
                              (x) => x.value === status,
                            )
                            if (newStatus) {
                              submission.status = newStatus.label
                            }
                          }
                        })
                        setSubmissions(obj)
                        setSelectedSubmissions([])
                      }
                      doApiRequest(
                        `/clubs/${club.code}/applications/${currentApplication.id}/submissions/status/?format=json`,
                        {
                          method: 'POST',
                          body: {
                            status: status,
                            submissions: selectedSubmissions,
                          },
                        },
                      )
                    }}
                  >
                    <Icon name="check" /> Update Status
                  </button>
                  <button
                    className="button is-primary"
                    onClick={() => {
                      const newSelectedSubmissions: number[] = []
                      submissions[currentApplication.id].forEach(
                        (submission) => {
                          if (selectedSubmissions.includes(submission.pk)) {
                            if (
                              !statusToggle ||
                              submission.status !== 'Pending'
                            ) {
                              // do not add pending values when we are deselecting
                              newSelectedSubmissions.push(submission.pk)
                            }
                          } else if (
                            !statusToggle &&
                            submission.status === 'Pending'
                          ) {
                            // add pending values when we are selecting
                            newSelectedSubmissions.push(submission.pk)
                          }
                        },
                      )
                      setStatusToggle(!statusToggle)
                      setSelectedSubmissions(newSelectedSubmissions)
                    }}
                  >
                    {statusToggle ? 'Des' : 'S'}
                    elect All Pending
                  </button>
                </div>
                <small>
                  Check the checkboxes next to submissions whose status you
                  would like to update. Once submissions have been checked, you
                  can pick a status here and click "Update Status" to submit.
                  This is just for your own book keeping (applicants will not
                  know that their submission status has changed). You can use
                  the "Select All Pending" button to batch update pending
                  applications (for example, you could manually mark all
                  accepted applications, then select all pending and mark them
                  as rejected to quickly update statuses).
                </small>
              </div>
              {submissions[currentApplication.id].length > 0 ? (
                <Table
                  data={submissions[currentApplication.id].map((item, index) =>
                    item.pk ? { ...item, id: item.pk } : { ...item, id: index },
                  )}
                  columns={responseTableFields}
                  searchableColumns={['name']}
                  filterOptions={[]}
                  focusable={true}
                  initialPage={pageIndex}
                  setInitialPage={setPageIndex}
                  initialPageSize={600}
                  onClick={(row, event) => {
                    if (
                      event.target?.type === 'checkbox' ||
                      event.target.tagName === 'svg' ||
                      event.target.tagName === 'path'
                    ) {
                      // manually prevent the propagation here
                      return
                    }
                    setShowModal(true)
                    const submission =
                      submissions[currentApplication.id].find(
                        (submission) => submission.pk === row.original.pk,
                      ) ?? null
                    setCurrentSubmission(submission)
                  }}
                />
              ) : (
                <>
                  <br></br>
                  <Text>
                    This application doesn't have any responses yet, check back
                    in later!
                  </Text>
                  <br></br>
                </>
              )}
            </>
          ) : (
            <Loading />
          )
        ) : null}
      </div>
      {currentApplication != null &&
        submissions[currentApplication.id] != null &&
        submissions[currentApplication.id].length > 0 && (
          <div style={{ marginTop: '1em' }}>
            <a
              href={
                currentApplication != null
                  ? getApiUrl(
                      `/clubs/${club.code}/applications/${currentApplication.id}/submissions/?format=xlsx`,
                    )
                  : '#'
              }
              className="button is-link is-small"
            >
              <Icon alt="download" name="download" /> Download Responses
            </a>
          </div>
        )}
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
    </>
  )
}
