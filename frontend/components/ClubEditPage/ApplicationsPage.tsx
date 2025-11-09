import { Field, Form, Formik } from 'formik'
import { json2csv } from 'json-2-csv'
import moment from 'moment-timezone'
import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
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
import { doApiRequest, getSemesterFromDate } from '~/utils'

import { Checkbox, Loading, Modal, Text } from '../common'
import { Icon } from '../common/Icon'
import Table from '../common/Table'
import {
  CheckboxField,
  DateTimeField,
  SelectField,
  TextField,
} from '../FormComponents'
import ModelForm from '../ModelForm'

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

const TableWrapper = styled.div`
transform:rotateX(180deg);
-ms-transform:rotateX(180deg); /* IE 9 */
-webkit-transform:rotateX(180deg);
font-size: 14px;
over
`

const ScrollWrapper = styled.div`
  transform: rotateX(180deg);
  -ms-transform: rotateX(180deg); /* IE 9 */
  -webkit-transform: rotateX(180deg);
  overflow-y: auto;
  margin-top: 1rem;
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
    label: 'Rejected after written application',
  },
  {
    value: ApplicationStatusType.RejectedInterview,
    label: 'Rejected after interview(s)',
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
  cycle: string
  application_end_time: string
}

const ModalContainer = styled.div`
  text-align: left;
  padding: 20px;
  height: 100%;
`

const SubmissionModal = (props: {
  club: string
  application: Application | null
  submission: ApplicationSubmission | null
  onLinkClicked?: () => void
}): ReactElement<any> => {
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
      <div className="mt-2 mb-2 notification is-info is-light">
        Current decision reason: {submission !== null && submission.reason}
      </div>
      <div className="mt-2 mb-2 notification is-info is-light">
        Current notification status:{' '}
        {submission !== null && submission.notified
          ? 'notified'
          : 'not notified'}
      </div>
    </ModalContainer>
  )
}
const NotificationModal = (props: {
  submissions: Array<ApplicationSubmission>
  club: string
  application: Application | null
  updateSubmissions: (arr: Array<ApplicationSubmission>) => void
}): ReactElement<any> => {
  const { submissions, club, application, updateSubmissions } = props
  const initialValues = { dry_run: true }
  const [submitMessage, setSubmitMessage] = useState<
    string | ReactElement<any> | null
  >(null)
  const options = [
    { value: 'acceptance', label: 'Acceptance' },
    { value: 'rejection', label: 'Rejection' },
  ]
  return (
    <ModalContainer>
      <Formik
        initialValues={initialValues}
        onSubmit={(data: any) => {
          if (data.email_type.id === 'acceptance' && !data.dry_run) {
            const relevant = submissions.filter(
              (sub) =>
                (data.allow_resend || !sub.notified) &&
                sub.status === 'Accepted' &&
                sub.reason,
            )
            updateSubmissions(relevant)
          } else if (data.email_type.id === 'rejection' && !data.dry_run) {
            const relevant = submissions.filter(
              (sub) =>
                (data.allow_resend || !sub.notified) &&
                sub.status.startsWith('Rejected') &&
                sub.reason,
            )
            updateSubmissions(relevant)
          }
          doApiRequest(
            `/clubs/${club}/applications/${
              application!.id
            }/send_emails/?format=json`,
            {
              method: 'POST',
              body: data,
            },
          ).then((response) => {
            response.json().then((data) => {
              setSubmitMessage(data.detail)
            })
          })
        }}
      >
        {(props) => (
          <Form>
            <StyledHeader style={{ marginBottom: '2px' }}>
              Send application updates
            </StyledHeader>
            <Text>
              Send acceptance or rejection emails. This may take a while...
            </Text>
            <Field
              name="email_type"
              required={true}
              as={SelectField}
              choices={options}
              label="Template"
              helpText="Choose from the following templates"
            />

            <Field
              name="dry_run"
              as={CheckboxField}
              label="Dry Run"
              helpText="If selected, will return the number of emails the script would have sent out"
            />
            <Field
              name="allow_resend"
              as={CheckboxField}
              label="Resend Emails"
              onClick={(e) => {
                if (e.target.checked) {
                  toast.warning(
                    'Resending emails will send emails to applicants who have already received update emails. Please proceed with caution.',
                  )
                }
              }}
              helpText={
                <strong className="has-text-danger">
                  If selected, will resend notifications to all applicants,
                  including those who have already been notified.
                </strong>
              }
            />
            <button type="submit" className="button">
              Submit
            </button>

            {submitMessage !== null && (
              <div className="mt-2 mb-2 notification is-info is-light">
                {submitMessage}
              </div>
            )}
          </Form>
        )}
      </Formik>
    </ModalContainer>
  )
}

const ReasonModal = (props: {
  submissions: Array<ApplicationSubmission> | null
  club: string
  application: Application | null
  updateSubmissions: (s: { name: string }) => void
}): ReactElement<any> => {
  const { submissions, club, application, updateSubmissions } = props
  const [submitMessage, setSubmitMessage] = useState<
    string | ReactElement<any> | null
  >(null)
  const initialValues = {}
  return (
    <ModalContainer>
      <Formik
        initialValues={initialValues}
        onSubmit={(data: { name: string }) => {
          const data_: { id: number; reason: string }[] = []
          for (const [key, value] of Object.entries(data)) {
            data_.push({ id: Number(key), reason: value })
          }
          updateSubmissions(data)
          doApiRequest(
            `/clubs/${club}/applications/${application?.id}/submissions/reason/?format=json`,
            {
              method: 'POST',
              body: { submissions: data_ },
            },
          ).then((response) => {
            response.json().then((data) => {
              setSubmitMessage(data.detail)
            })
          })
        }}
      >
        {(props) => (
          <Form>
            <StyledHeader style={{ marginBottom: '2px' }}>
              Update reasons for selected{' '}
              {submissions != null && submissions[0] != null
                ? submissions[0].status
                : null}{' '}
              applicants
            </StyledHeader>
            {submissions != null
              ? submissions.map((data) => {
                  return (
                    data != null && (
                      <div>
                        <Field
                          name={data.pk}
                          label={`Reason for ${data.first_name} ${data.last_name} (committee ${data.committee})`}
                          as={TextField}
                        />
                      </div>
                    )
                  )
                })
              : null}
            <button type="submit" className="button">
              Submit
            </button>
            {submitMessage !== null && (
              <div className="mt-2 mb-2 notification is-info is-light">
                {submitMessage}
              </div>
            )}
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
}): ReactElement<any> {
  const [applications, setApplications] = useState<Array<Application> | null>(
    null,
  )
  const [currentApplication, setCurrentApplication] =
    useState<Application | null>(null)
  const [submissions, setSubmissions] = useState<{
    [key: number]: Array<ApplicationSubmission>
  }>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [showNotifModal, setShowNotifModal] = useState<boolean>(false)
  const [showReasonModal, setShowReasonModal] = useState<boolean>(false)
  const [currentSubmission, setCurrentSubmission] =
    useState<ApplicationSubmission | null>(null)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [statusToggle, setStatusToggle] = useState<boolean>(false)
  const [categoriesSelectAll, setCategoriesSelectAll] = useState<Array<string>>(
    [],
  )
  const [filteredSubmissionsForExport, setFilteredSubmissionsForExport] =
    useState<Array<ApplicationSubmission>>([])

  useEffect(() => {
    doApiRequest(`/clubs/${club.code}/applications/?format=json`, {
      method: 'GET',
    })
      .then((resp) => resp.json())
      .then((applications) => {
        setApplications(applications)
        if (applications.length !== 0) {
          setCurrentApplication({
            ...applications[applications.length - 1],
            name: format_app_name(applications[applications.length - 1]),
          })
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
                status:
                  APPLICATION_STATUS_TYPES.find(
                    (status) => status.value === response.status,
                  )?.label + (response.notified ? ' (notified)' : ''),
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

  const [submitMessage, setSubmitMessage] = useState<
    string | ReactElement<any> | null
  >(null)

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
    { label: 'Committee', name: 'committee' },
    { label: 'Status', name: 'status' },
    { label: 'Graduation Year', name: 'graduation_year' },
  ]

  const extensionTableFields = [
    { label: 'First Name', name: 'first_name' },
    { label: 'Last Name', name: 'last_name' },
    { label: 'Username', name: 'username' },
    { label: 'Graduation Year', name: 'graduation_year' },
    { label: 'Extension End Time', name: 'end_time' },
  ]

  const columns = useMemo(
    () =>
      responseTableFields.map(({ label, name }) => ({
        Header: label ?? name,
        accessor: name,
      })),
    [responseTableFields],
  )

  const tableData = useMemo(
    () =>
      currentApplication != null && submissions[currentApplication.id] != null
        ? submissions[currentApplication.id].map((item, index) =>
            item.pk ? { ...item, id: item.pk } : { ...item, id: index },
          )
        : [],
    [submissions, currentApplication?.id],
  )

  function downloadResponsesCsv() {
    if (
      currentApplication == null ||
      submissions[currentApplication.id] == null ||
      submissions[currentApplication.id].length === 0
    ) {
      return
    }

    const rows =
      filteredSubmissionsForExport && filteredSubmissionsForExport.length > 0
        ? filteredSubmissionsForExport
        : submissions[currentApplication.id]

    // Collect all unique question prompts across filtered rows
    const promptSet = new Set<string>()
    rows.forEach((sub) => {
      if (sub.responses) {
        sub.responses.forEach((r) => {
          if (r && r.question && r.question.prompt) {
            promptSet.add(r.question.prompt)
          }
        })
      }
    })
    const prompts = Array.from(promptSet).sort((a, b) => a.localeCompare(b))

    // Build CSV records with required base fields and question columns
    const records = rows.map((sub) => {
      const base: { [key: string]: string } = {
        'First Name': sub.first_name || '',
        'Last Name': sub.last_name || '',
        Email: sub.email || '',
        Committee: sub.committee || 'General Member',
        Status: sub.status || '',
        'Graduation Year': sub.graduation_year || '',
      }

      // Build a quick lookup for responses by prompt
      const responsesByPrompt: { [prompt: string]: string } = {}
      if (sub.responses) {
        sub.responses.forEach((r) => {
          const prompt = r?.question?.prompt
          if (!prompt) return
          const mc = r?.multiple_choice?.value
          const text = r?.text
          responsesByPrompt[prompt] = (mc != null ? mc : text) || ''
        })
      }

      prompts.forEach((p) => {
        base[p] = responsesByPrompt[p] || ''
      })

      return base
    })

    try {
      const csv = json2csv(records, { emptyFieldValue: '' })
      const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
      const a = document.createElement('a')
      a.setAttribute('href', dataStr)
      a.setAttribute('download', 'submissions.csv')
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      toast.error('Failed to download CSV. Please try again.')
    }
  }

  const format_app_name: (application: Application) => any = (application) => (
    <span>
      {application.name} {' - '}
      <span className="has-text-weight-semibold">
        {application.cycle ||
          getSemesterFromDate(application.application_end_time)}
      </span>
    </span>
  )

  return (
    <>
      <StyledHeader style={{ marginBottom: '2px' }}>Applications</StyledHeader>
      {applications === null ? (
        <Loading />
      ) : applications.length === 0 ? (
        <Text>
          No applications have been created for this club.{' '}
          <a href={`/club/${club.code}/edit/recruitment`}>
            Create a new application.
          </a>
        </Text>
      ) : (
        <>
          <Text>
            Select an application here and responses will populate below! Click
            on any response to see the entire application. You can also download
            to CSV.
          </Text>
          <Select
            options={applications.toReversed().map((application) => {
              return {
                ...application,
                value: application.id,
                label: format_app_name(application),
              }
            })}
            value={
              currentApplication != null
                ? {
                    ...currentApplication,
                    value: currentApplication.id,
                    label: currentApplication.name,
                  }
                : null
            }
            onChange={(
              v: {
                value: number
                label: string
                cycle: string
                application_end_time: string
              } | null,
            ) =>
              v != null &&
              setCurrentApplication({ ...v, id: v.value, name: v.label })
            }
          />
        </>
      )}
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
                      }
                      doApiRequest(
                        `/clubs/${club.code}/applications/${currentApplication.id}/submissions/status/?format=json`,
                        {
                          method: 'POST',
                          body: {
                            status,
                            submissions: selectedSubmissions,
                          },
                        },
                      ).then((response) => {
                        response.json().then((data) => {
                          setSubmitMessage(data.detail)
                        })
                      })

                      setShowReasonModal(true)
                    }}
                  >
                    <Icon name="check" /> Update Status
                  </button>
                  <button
                    className="button is-link mr-3"
                    onClick={(event) => {
                      if (selectedSubmissions.length > 0) {
                        toast.warning(
                          'This will send emails to all applicants, including those not selected!',
                        )
                      }
                      setShowNotifModal(true)
                    }}
                  >
                    Send Updates
                  </button>
                  <button
                    className="button is-primary"
                    onClick={() => {
                      const statusLabel = APPLICATION_STATUS.find(
                        (x) => x?.value === status,
                      )?.label
                      const deselecting =
                        statusLabel != null &&
                        categoriesSelectAll.includes(statusLabel)

                      if (deselecting) {
                        const newCategoriesSelectAll =
                          categoriesSelectAll.filter((e) => e !== statusLabel)
                        setCategoriesSelectAll(newCategoriesSelectAll)
                      } else {
                        const newCategoriesSelectAll = categoriesSelectAll
                        statusLabel != null &&
                          newCategoriesSelectAll.push(statusLabel)
                        setCategoriesSelectAll(newCategoriesSelectAll)
                      }
                      const newSelectedSubmissions: number[] = []
                      submissions[currentApplication.id].forEach(
                        (submission) => {
                          if (selectedSubmissions.includes(submission.pk)) {
                            if (
                              deselecting &&
                              submission.status !== statusLabel
                            ) {
                              newSelectedSubmissions.push(submission.pk)
                            } else if (!deselecting) {
                              newSelectedSubmissions.push(submission.pk)
                            }
                          } else if (
                            !deselecting &&
                            submission.status === statusLabel
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
                    {categoriesSelectAll.includes(
                      APPLICATION_STATUS.find((x) => x?.value === status)
                        ?.label || '',
                    )
                      ? 'Deselect All '
                      : 'Select All '}
                    {APPLICATION_STATUS.find((x) => x?.value === status)?.label}
                  </button>
                </div>
                {submitMessage !== null && (
                  <div className="mt-2 mb-2 notification is-info is-light">
                    {submitMessage}
                  </div>
                )}
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
                <ScrollWrapper>
                  <TableWrapper>
                    <Table
                      data={tableData}
                      columns={responseTableFields}
                      searchableColumns={['name']}
                      onFilteredDataChange={(rows) =>
                        setFilteredSubmissionsForExport(
                          rows as Array<ApplicationSubmission>,
                        )
                      }
                      filterOptions={[
                        {
                          label: 'notified',
                          options: [
                            { key: false, label: 'False' },
                            { key: true, label: 'True' },
                          ],
                          filterFunction: (selection, object) =>
                            object.notified === selection,
                        },
                        {
                          label: 'reason',
                          options: [
                            { key: false, label: 'Set' },
                            { key: true, label: 'Unset' },
                          ],
                          filterFunction: (selection, object) =>
                            selection
                              ? object.reason === ''
                              : object.reason !== '',
                        },
                        {
                          label: 'status',
                          options: [
                            {
                              key: 'Pending',
                              label: 'Pending',
                            },
                            {
                              key: 'Accepted',
                              label: 'Accepted',
                            },
                            {
                              key: 'Rejected after written application',
                              label: 'Rejected after written application',
                            },
                            {
                              key: 'Rejected after interview(s)',
                              label: 'Rejected after interview(s)',
                            },
                          ],
                          filterFunction: (selection, object) =>
                            object.status === selection,
                        },
                      ]}
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
                  </TableWrapper>
                </ScrollWrapper>
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
            <button
              className="button is-link is-small"
              onClick={downloadResponsesCsv}
            >
              <Icon alt="download" name="download" /> Download Responses
            </button>
          </div>
        )}
      <div>
        {applications !== null &&
        applications.length > 0 &&
        currentApplication != null ? (
          <>
            <StyledHeader style={{ marginBottom: '2px' }}>
              Extensions
            </StyledHeader>
            <ModelForm
              key={currentApplication.id}
              baseUrl={`/clubs/${club.code}/applications/${currentApplication.id}/extensions/`}
              fields={
                <>
                  <Field
                    name="username"
                    as={TextField}
                    required={true}
                    helpText="The username (PennKey) of the applicant to be granted an extension."
                  />
                  <Field
                    name="end_time"
                    as={DateTimeField}
                    required={true}
                    helpText="The extended end time for this applicant's application."
                  />
                </>
              }
              tableFields={extensionTableFields}
              confirmDeletion
              searchableColumns={['username']}
              noun="Extension"
            />
          </>
        ) : null}
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
      {showNotifModal && (
        <Modal
          show={showNotifModal}
          closeModal={() => setShowNotifModal(false)}
          width="80%"
          marginBottom={false}
        >
          <NotificationModal
            club={club.code}
            application={currentApplication}
            submissions={submissions[currentApplication!.id]}
            updateSubmissions={(arr: Array<ApplicationSubmission>) => {
              if (currentApplication != null) {
                for (const submission of arr) {
                  const item = submissions[currentApplication.id].find(
                    (sub) => sub.pk === submission.pk,
                  )!
                  const idx = submissions[currentApplication.id].indexOf(item)
                  submissions[currentApplication.id][idx].notified = true
                }
                setSubmissions(submissions)
              }
            }}
          />
        </Modal>
      )}
      {showReasonModal && (
        <Modal
          show={showReasonModal}
          closeModal={() => {
            setShowReasonModal(false)
            setSelectedSubmissions([])
          }}
          width="80%"
          marginBottom={false}
        >
          <ReasonModal
            club={club.code}
            application={currentApplication}
            updateSubmissions={(s: { name: string }) => {
              if (currentApplication != null) {
                for (const [id, value] of Object.entries(s)) {
                  const item = submissions[currentApplication.id].find(
                    (sub) => sub.pk === Number(id),
                  )!
                  const idx = submissions[currentApplication.id].indexOf(item)
                  submissions[currentApplication.id][idx].reason = value
                }
                setSubmissions(submissions)
              }
            }}
            submissions={selectedSubmissions.map(
              (i) =>
                submissions[currentApplication!.id].find(
                  (sub) => sub.pk === i,
                )!,
            )}
          />
        </Modal>
      )}
    </>
  )
}
