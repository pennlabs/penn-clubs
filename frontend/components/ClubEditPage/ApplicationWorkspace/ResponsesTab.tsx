import moment from 'moment-timezone'
import { ReactElement, ReactNode, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading, Modal } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  CLUBS_BLUE,
  CLUBS_GREY,
  MD,
  mediaMaxWidth,
} from '~/constants'
import { ApplicationQuestion, ApplicationStatusType } from '~/types'
import { doApiRequest } from '~/utils'

import { exportToGoogleSheets } from '../Google'
import {
  answerableQuestions,
  answerText,
  Muted,
  Panel,
  Pill,
  SegmentedControl,
  STATUS_LABELS,
  Submission,
  WorkspaceApplication,
} from './shared'
import SummaryView from './SummaryView'

const fullName = (submission: Submission) =>
  `${submission.first_name} ${submission.last_name}`.trim() || submission.email

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;

  .spacer {
    flex: 1;
  }
`

const Split = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: start;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
  }
`

const ApplicantList = styled.ul`
  max-height: 600px;
  overflow-y: auto;
  margin: 8px -24px -20px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 24px;
    border-top: 1px solid ${ALLBIRDS_GRAY};
    cursor: pointer;
  }

  li:hover {
    background: #f7f7f8;
  }

  li.is-selected {
    background: #eef0fe;
    box-shadow: inset 3px 0 0 ${CLUBS_BLUE};
  }

  .who {
    flex: 1;
    min-width: 0;
  }

  .name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Filters = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
`

const DetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${CLUBS_GREY};
    margin-bottom: 2px;
  }
`

const Pager = styled.div`
  flex: none;
  display: inline-flex;
  align-items: center;
  border: 1px solid ${ALLBIRDS_GRAY};
  border-radius: 8px;
  overflow: hidden;

  button {
    border: none;
    background: #fff;
    padding: 4px 8px;
    cursor: pointer;
    color: ${CLUBS_GREY};
  }

  button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  span {
    padding: 0 10px;
    font-size: 0.85rem;
    color: ${CLUBS_GREY};
    border-left: 1px solid ${ALLBIRDS_GRAY};
    border-right: 1px solid ${ALLBIRDS_GRAY};
    line-height: 30px;
  }
`

const DecisionBox = styled.div`
  background: #f7f7f8;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 16px 0;

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  textarea {
    min-height: 0;
    font-size: 0.9rem;
  }
`

const Answer = styled.div`
  padding: 12px 0;
  border-top: 1px solid ${ALLBIRDS_GRAY};

  h5 {
    font-weight: 600;
    margin-bottom: 4px;
  }

  p {
    white-space: pre-wrap;
  }
`

const StatusSelect = ({
  value,
  onChange,
  placeholder,
}: {
  value?: ApplicationStatusType
  onChange: (status: ApplicationStatusType) => void
  placeholder?: string
}): ReactElement => (
  <div className="select is-small">
    <select
      value={value ?? ''}
      onChange={(e) => e.target.value && onChange(Number(e.target.value))}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {Object.entries(STATUS_LABELS).map(([status, label]) => (
        <option key={status} value={status}>
          {label}
        </option>
      ))}
    </select>
  </div>
)

const Individual = ({
  submissions,
  questions,
  filters,
  onStatus,
  onReason,
}: {
  submissions: Submission[]
  questions: ApplicationQuestion[]
  filters: ReactNode

  onStatus: (pks: number[], status: ApplicationStatusType) => Promise<void>
  onReason: (pk: number, reason: string) => Promise<void>
}): ReactElement => {
  const [selectedPk, setSelectedPk] = useState<number | null>(null)
  const [checked, setChecked] = useState<number[]>([])
  const index = Math.max(
    submissions.findIndex(({ pk }) => pk === selectedPk),
    0,
  )
  const selected = submissions[index]
  const [reason, setReason] = useState(selected?.reason ?? '')

  useEffect(() => setReason(selected?.reason ?? ''), [selected?.pk])

  if (submissions.length === 0) {
    return (
      <Split>
        <Panel>
          {filters}
          <Muted>No applicants match.</Muted>
        </Panel>
      </Split>
    )
  }

  const toggle = (pk: number) =>
    setChecked(
      checked.includes(pk)
        ? checked.filter((other) => other !== pk)
        : [...checked, pk],
    )

  return (
    <Split>
      <Panel>
        {filters}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={checked.length === submissions.length}
            onChange={(e) =>
              setChecked(
                e.target.checked ? submissions.map(({ pk }) => pk) : [],
              )
            }
          />{' '}
          <Muted>
            {checked.length > 0
              ? `${checked.length} selected`
              : 'Select applicants'}
          </Muted>
        </label>
        {checked.length > 0 && (
          <div className="mt-2">
            <StatusSelect
              placeholder="Set status…"
              onChange={(status) =>
                onStatus(checked, status).then(() => setChecked([]))
              }
            />
          </div>
        )}
        <ApplicantList>
          {submissions.map((submission) => (
            <li
              key={submission.pk}
              className={submission.pk === selected.pk ? 'is-selected' : ''}
              onClick={() => setSelectedPk(submission.pk)}
            >
              <input
                type="checkbox"
                checked={checked.includes(submission.pk)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggle(submission.pk)}
              />
              <span className="who">
                <span className="name">{fullName(submission)}</span>
                <Pill $status={submission.status}>
                  {STATUS_LABELS[submission.status]}
                </Pill>{' '}
                {submission.committee && (
                  <Muted>{submission.committee.name}</Muted>
                )}
              </span>
            </li>
          ))}
        </ApplicantList>
      </Panel>

      <Panel>
        <DetailHeader>
          <h3>{fullName(selected)}</h3>
          <Pager>
            <button
              title="Previous applicant"
              disabled={index === 0}
              onClick={() => setSelectedPk(submissions[index - 1].pk)}
            >
              <Icon name="chevron-left" alt="previous" />
            </button>
            <span>
              {index + 1} of {submissions.length}
            </span>
            <button
              title="Next applicant"
              disabled={index === submissions.length - 1}
              onClick={() => setSelectedPk(submissions[index + 1].pk)}
            >
              <Icon name="chevron-right" alt="next" />
            </button>
          </Pager>
        </DetailHeader>
        <Muted as="p" className="mt-1">
          {[
            selected.email,
            selected.graduation_year && `Class of ${selected.graduation_year}`,
            selected.committee?.name,
          ]
            .filter(Boolean)
            .join(' · ')}
          <br />
          Submitted{' '}
          {moment(selected.created_at)
            .tz('America/New_York')
            .format('MMM D [at] h:mm A')}
          {' · '}
          {selected.notified ? 'Decision email sent' : 'No decision email yet'}
        </Muted>

        <DecisionBox>
          <div className="row">
            <b>Decision</b>
            <StatusSelect
              value={selected.status}
              onChange={(status) => onStatus([selected.pk], status)}
            />
          </div>
          <textarea
            className="textarea"
            rows={2}
            placeholder="Reason, used in the decision email"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() =>
              reason !== selected.reason && onReason(selected.pk, reason)
            }
          />
        </DecisionBox>

        {answerableQuestions(questions).map((question) => {
          const answer = answerText(
            selected.responses.find(
              (response) => response.question.id === question.id,
            ),
          )
          return (
            <Answer key={question.id}>
              <h5>{question.prompt}</h5>
              {answer ? <p>{answer}</p> : <Muted>No answer</Muted>}
            </Answer>
          )
        })}
      </Panel>
    </Split>
  )
}

const DecisionEmails = ({
  url,
  onSent,
}: {
  url: string
  onSent: () => void
}): ReactElement => {
  const [type, setType] = useState<'acceptance' | 'rejection'>('acceptance')
  const [resend, setResend] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const send = async (dryRun: boolean) => {
    setConfirming(false)
    const resp = await doApiRequest(`${url}send_emails/?format=json`, {
      method: 'POST',
      // eslint-disable-next-line camelcase
      body: { email_type: { id: type }, dry_run: dryRun, allow_resend: resend },
    })
    const data = await resp.json().catch(() => null)
    setMessage(data?.detail ?? 'Something went wrong. Please try again.')
    if (!dryRun) {
      onSent()
    }
  }

  return (
    <div style={{ padding: 28, textAlign: 'left' }}>
      <h3 className="title is-4">Send decision emails</h3>
      <p className="mb-3">
        Emails go to applicants with a matching decision and a reason filled in.
        You can edit the email text under Settings.
      </p>
      <div className="control mb-3">
        {(['acceptance', 'rejection'] as const).map((option) => (
          <label className="radio mr-4" key={option}>
            <input
              type="radio"
              checked={type === option}
              onChange={() => setType(option)}
            />{' '}
            {option === 'acceptance' ? 'Acceptances' : 'Rejections'}
          </label>
        ))}
      </div>
      <label className="checkbox mb-4">
        <input
          type="checkbox"
          checked={resend}
          onChange={(e) => setResend(e.target.checked)}
        />{' '}
        Also email applicants who already got one
      </label>
      {confirming ? (
        <div className="notification is-warning is-light">
          <p className="mb-3">
            Send {type} emails now? Applicants get them right away, so this
            can't be undone.
          </p>
          <div className="buttons">
            <button className="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button className="button is-primary" onClick={() => send(false)}>
              Yes, send them
            </button>
          </div>
        </div>
      ) : (
        <div className="buttons mt-3">
          <button className="button" onClick={() => send(true)}>
            Check who would get it
          </button>
          <button
            className="button is-primary"
            onClick={() => setConfirming(true)}
          >
            <Icon name="send" alt="" /> Send emails
          </button>
        </div>
      )}
      {message && (
        <div className="notification is-info is-light">{message}</div>
      )}
    </div>
  )
}

export default function ResponsesTab({
  clubCode,
  application,
}: {
  clubCode: string
  application: WorkspaceApplication
}): ReactElement {
  const url = `/clubs/${clubCode}/applications/${application.id}/`
  const [submissions, setSubmissions] = useState<Submission[] | null>(null)
  const [questions, setQuestions] = useState<ApplicationQuestion[]>([])
  const [view, setView] = useState<'summary' | 'individual'>('summary')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusType>()
  const [search, setSearch] = useState('')
  const [showEmails, setShowEmails] = useState(false)
  const committees = (application.committees ?? []).map(({ name }) => name)

  const load = () =>
    Promise.all(
      ['submissions', 'questions'].map((path) =>
        doApiRequest(`${url}${path}/?format=json`).then((resp) => resp.json()),
      ),
    ).then(([submissions, questions]) => {
      setSubmissions(submissions)
      setQuestions(questions)
    })

  useEffect(() => {
    load()
  }, [url])

  if (submissions === null) {
    return <Loading />
  }

  const visible = submissions.filter(
    (submission) =>
      (statusFilter == null || submission.status === statusFilter) &&
      `${fullName(submission)} ${submission.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )

  const update = (pks: number[], changes: Partial<Submission>) =>
    setSubmissions(
      submissions.map((submission) =>
        pks.includes(submission.pk)
          ? { ...submission, ...changes }
          : submission,
      ),
    )

  const post = async (path: string, body: object) => {
    const resp = await doApiRequest(`${url}submissions/${path}/?format=json`, {
      method: 'POST',
      body,
    })
    if (!resp.ok) {
      toast.error('Could not save that change. Please try again.')
    }
    return resp.ok
  }

  const onStatus = async (pks: number[], status: ApplicationStatusType) => {
    if (await post('status', { status, submissions: pks })) {
      update(pks, { status })
    }
  }

  const onReason = async (pk: number, reason: string) => {
    if (await post('reason', { submissions: [{ id: pk, reason }] })) {
      update([pk], { reason })
    }
  }

  // the visible responses as rows, with a header row first
  const exportRows = (): string[][] => {
    const asked = answerableQuestions(questions)
    return [
      [
        'First name',
        'Last name',
        'Email',
        'Committee',
        'Status',
        'Reason',
        'Graduation year',
        'Submitted',
        ...asked.map(({ prompt }) => prompt),
      ],
      ...visible.map((submission) => [
        submission.first_name,
        submission.last_name,
        submission.email,
        submission.committee?.name ?? 'General Member',
        STATUS_LABELS[submission.status],
        submission.reason,
        submission.graduation_year ?? '',
        moment(submission.created_at).tz('America/New_York').format('LLL'),
        ...asked.map((question) =>
          answerText(
            submission.responses.find(
              (response) => response.question.id === question.id,
            ),
          ),
        ),
      ]),
    ]
  }

  const downloadCsv = () => {
    const csv = exportRows()
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    )
    link.download = `${application.name} responses.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const filters = (
    <Filters>
      <input
        className="input is-small"
        placeholder="Search applicants"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="select is-small is-fullwidth">
        <select
          value={statusFilter ?? ''}
          onChange={(e) =>
            setStatusFilter(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </Filters>
  )

  if (submissions.length === 0) {
    return (
      <Panel className="has-text-centered py-6">
        <h3 className="title is-5">No responses yet</h3>
        <Muted>
          Share the application link from the top of this page. Responses will
          show up here as students apply.
        </Muted>
      </Panel>
    )
  }

  return (
    <>
      <Toolbar>
        <SegmentedControl>
          {(['summary', 'individual'] as const).map((option) => (
            <button
              key={option}
              className={view === option ? 'is-active' : ''}
              onClick={() => setView(option)}
            >
              {option === 'summary'
                ? 'Summary'
                : `Individual (${submissions.length})`}
            </button>
          ))}
        </SegmentedControl>
        <span className="spacer" />
        <button className="button is-small" onClick={downloadCsv}>
          <Icon name="download" alt="" /> CSV
        </button>
        <button
          className="button is-small"
          onClick={() =>
            exportToGoogleSheets(`${application.name} responses`, exportRows())
          }
        >
          <Icon name="external-link" alt="" /> Google Sheets
        </button>
        <button
          className="button is-small is-primary"
          onClick={() => setShowEmails(true)}
        >
          <Icon name="mail" alt="" /> Send decisions
        </button>
      </Toolbar>

      {view === 'summary' ? (
        <SummaryView
          submissions={submissions}
          questions={questions}
          committees={committees}
        />
      ) : (
        <Individual
          submissions={visible}
          questions={questions}
          filters={filters}
          onStatus={onStatus}
          onReason={onReason}
        />
      )}

      {showEmails && (
        <Modal
          show
          closeModal={() => setShowEmails(false)}
          width="50%"
          marginBottom={false}
        >
          <DecisionEmails url={url} onSent={load} />
        </Modal>
      )}
    </>
  )
}
