import moment from 'moment-timezone'
import { ReactElement, ReactNode, useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Icon, Loading, Modal } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  CLUBS_GREY,
  MD,
  mediaMaxWidth,
} from '~/constants'
import { ApplicationQuestion, ApplicationStatusType } from '~/types'
import { doApiRequest } from '~/utils'

import {
  selectCompactStyles,
  selectComponents,
  selectMenuPortalTarget,
} from '../../common/selectStyles'
import { AdminGhost, AdminPrimary } from '../adminControls'
import { ADMIN_NAVY } from '../adminTheme'
import { exportToGoogleSheets } from '../Google'
import {
  answerableQuestions,
  answerText,
  Muted,
  Panel,
  Pill,
  STATUS_LABELS,
  Submission,
  SegmentedControl,
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
  min-width: 0;

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
`

const Fill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`

const SummaryScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const Split = styled.div<{ $listOpen?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $listOpen }) =>
    $listOpen ? '300px minmax(0, 1fr)' : 'minmax(0, 1fr)'};
  gap: 16px;
  align-items: stretch;
  flex: 1;
  min-height: 0;
  height: 100%;

  ${mediaMaxWidth(MD)} {
    grid-template-columns: 1fr;
    overflow: auto;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`

const ListHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 8px;
`

const MinimizeButton = styled.button`
  appearance: none;
  align-items: center;
  background: #f3f3f3;
  border: 0;
  border-radius: 8px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 32px;
  justify-content: center;
  margin-left: auto;
  padding: 0;
  width: 32px;

  &:hover {
    background: #e8e8e8;
  }
`

const DetailScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const SelectApplicants = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  flex-shrink: 0;
  font-size: 13px;
  margin: 0;
`

const ApplicantList = styled.ul`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  list-style: none;
  margin: 8px 0 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 4px;
    border-top: 1px solid ${ALLBIRDS_GRAY};
    cursor: pointer;
  }

  li:hover {
    background: #f7f7f8;
  }

  li.is-selected {
    background: #eef0fe;
  }

  .who {
    flex: 1;
    min-width: 0;
  }

  .line {
    align-items: center;
    display: flex;
    gap: 8px;
    min-width: 0;
  }

  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .line > :last-child {
    flex-shrink: 0;
  }
`

const Filters = styled.div`
  display: grid;
  gap: 8px;
  flex-shrink: 0;
  margin-bottom: 8px;
`

const DetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
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
  gap: 2px;

  button {
    border: none;
    background: transparent;
    padding: 4px 8px;
    cursor: pointer;
    color: ${CLUBS_GREY};
  }

  button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  span {
    padding: 0 8px;
    font-size: 0.85rem;
    color: ${CLUBS_GREY};
    line-height: 30px;
  }
`

const DecisionBox = styled.div`
  background: #f7f7f8;
  border-radius: 6px;
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
  <Select
    styles={selectCompactStyles}
    components={selectComponents}
    menuPortalTarget={selectMenuPortalTarget}
    menuPosition="fixed"
    isClearable={Boolean(placeholder)}
    placeholder={placeholder ?? 'Status'}
    value={
      value != null
        ? { value, label: STATUS_LABELS[value] }
        : null
    }
    options={Object.entries(STATUS_LABELS).map(([status, label]) => ({
      value: Number(status),
      label,
    }))}
    onChange={(option) => {
      if (option) {
        onChange(option.value)
      }
    }}
  />
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
  const [listOpen, setListOpen] = useState(true)
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
      <Split $listOpen>
        <Column>
          {filters}
          <Muted>No applicants match.</Muted>
        </Column>
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
    <Split $listOpen={listOpen}>
      {listOpen && (
      <Column>
        <ListHead>
          <SelectApplicants>
            <input
              type="checkbox"
              checked={checked.length === submissions.length}
              onChange={(e) =>
                setChecked(
                  e.target.checked ? submissions.map(({ pk }) => pk) : [],
                )
              }
            />
            {checked.length > 0
              ? `${checked.length} selected`
              : 'Select applicants'}
          </SelectApplicants>
          <MinimizeButton
            type="button"
            aria-label="Hide applicant list"
            title="Hide applicant list"
            onClick={() => setListOpen(false)}
          >
            <Icon name="x" alt="" size="1rem" fitSize />
          </MinimizeButton>
        </ListHead>
        {filters}
        {checked.length > 0 && (
          <div style={{ flexShrink: 0, marginBottom: 8 }}>
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
                <span className="line">
                  <span className="name">{fullName(submission)}</span>
                  <Pill $status={submission.status}>
                    {STATUS_LABELS[submission.status]}
                  </Pill>
                </span>
                {submission.committee && (
                  <Muted>{submission.committee.name}</Muted>
                )}
              </span>
            </li>
          ))}
        </ApplicantList>
      </Column>
      )}

      <Column>
        <DetailHeader>
          <h3>{fullName(selected)}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!listOpen && (
            <AdminGhost type="button" onClick={() => setListOpen(true)}>
              Applicants
            </AdminGhost>
          )}
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
          </div>
        </DetailHeader>
        <Muted as="p" className="mt-1" style={{ flexShrink: 0 }}>
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

        <DetailScroll>
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
        </DetailScroll>
      </Column>
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
            <AdminGhost type="button" onClick={() => setConfirming(false)}>
              Cancel
            </AdminGhost>
            <AdminPrimary type="button" onClick={() => send(false)}>
              Yes, send them
            </AdminPrimary>
          </div>
        </div>
      ) : (
        <div className="buttons mt-3">
          <AdminGhost type="button" onClick={() => send(true)}>
            Check who would get it
          </AdminGhost>
          <AdminPrimary type="button" onClick={() => setConfirming(true)}>
            <Icon name="send" alt="" /> Send emails
          </AdminPrimary>
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
  chrome,
}: {
  clubCode: string
  application: WorkspaceApplication
  chrome?: (toolbar: ReactNode) => ReactNode
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
    return (
      <>
        {chrome?.(null)}
        <Fill>
          <Loading />
        </Fill>
      </>
    )
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
      <Select
        styles={selectCompactStyles}
        components={selectComponents}
        menuPortalTarget={selectMenuPortalTarget}
        menuPosition="fixed"
        isClearable
        placeholder="All statuses"
        value={
          statusFilter != null
            ? { value: statusFilter, label: STATUS_LABELS[statusFilter] }
            : null
        }
        options={Object.entries(STATUS_LABELS).map(([status, label]) => ({
          value: Number(status),
          label,
        }))}
        onChange={(option) =>
          setStatusFilter(option ? option.value : undefined)
        }
      />
    </Filters>
  )

  const toolbar =
    submissions.length === 0 ? null : (
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
        <div className="actions">
          <AdminGhost type="button" onClick={downloadCsv}>
            <Icon name="download" alt="" /> CSV
          </AdminGhost>
          <AdminGhost
            type="button"
            onClick={() =>
              exportToGoogleSheets(
                `${application.name} responses`,
                exportRows(),
              )
            }
          >
            <Icon name="external-link" alt="" /> Google Sheets
          </AdminGhost>
          <AdminPrimary type="button" onClick={() => setShowEmails(true)}>
            <Icon name="mail" alt="" /> Send decisions
          </AdminPrimary>
        </div>
      </Toolbar>
    )

  if (submissions.length === 0) {
    return (
      <>
        {chrome?.(null)}
        <Fill>
          <Panel className="has-text-centered py-6">
            <h3 className="title is-5">No responses yet</h3>
            <Muted>
              Share the application link from the top of this page. Responses
              will show up here as students apply.
            </Muted>
          </Panel>
        </Fill>
      </>
    )
  }

  return (
    <>
      {chrome?.(toolbar)}
      <Fill>
        {view === 'summary' ? (
          <SummaryScroll>
            <SummaryView
              submissions={submissions}
              questions={questions}
              committees={committees}
            />
          </SummaryScroll>
        ) : (
          <Individual
            submissions={visible}
            questions={questions}
            filters={filters}
            onStatus={onStatus}
            onReason={onReason}
          />
        )}
      </Fill>

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
