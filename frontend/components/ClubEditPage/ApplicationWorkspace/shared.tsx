import moment from 'moment-timezone'
import { ReactElement, ReactNode, useState } from 'react'
import styled from 'styled-components'

import { Modal } from '~/components/common'
import { ALLBIRDS_GRAY, CLUBS_BLUE, CLUBS_GREY, MEDIUM_GRAY } from '~/constants'
import {
  Application,
  ApplicationQuestion,
  ApplicationQuestionType,
  ApplicationResponse,
  ApplicationStatusType,
  ApplicationSubmission,
} from '~/types'

export type WorkspaceApplication = Application & {
  active: boolean
  cycle: string
}

// a submission as the officer submissions endpoint returns it
export type Submission = Omit<ApplicationSubmission, 'status' | 'committee'> & {
  status: ApplicationStatusType
  committee: { name: string } | null
}

export const STATUS_LABELS: { [status: number]: string } = {
  [ApplicationStatusType.Pending]: 'Pending',
  [ApplicationStatusType.Accepted]: 'Accepted',
  [ApplicationStatusType.RejectedWritten]: 'Rejected (written)',
  [ApplicationStatusType.RejectedInterview]: 'Rejected (interview)',
}

// status colors carry a text label, so they never stand alone
const STATUS_COLORS: { [status: number]: [string, string] } = {
  [ApplicationStatusType.Pending]: ['#f1f2f4', CLUBS_GREY],
  [ApplicationStatusType.Accepted]: ['#e3f5e8', '#1e6b35'],
  [ApplicationStatusType.RejectedWritten]: ['#fde8e8', '#a32020'],
  [ApplicationStatusType.RejectedInterview]: ['#fde8e8', '#a32020'],
}

export const Pill = styled.span<{ $status?: number }>`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  background-color: ${({ $status }) =>
    STATUS_COLORS[$status ?? ApplicationStatusType.Pending][0]};
  color: ${({ $status }) =>
    STATUS_COLORS[$status ?? ApplicationStatusType.Pending][1]};
`

export const Panel = styled.div`
  background: #fff;
  border: 1px solid ${ALLBIRDS_GRAY};
  border-radius: 8px;
  padding: 20px 24px;
  margin-bottom: 16px;
`

export const Muted = styled.span`
  color: ${MEDIUM_GRAY};
  font-size: 0.875rem;
`

export const SegmentedControl = styled.div`
  display: inline-flex;
  border: 1px solid ${ALLBIRDS_GRAY};
  border-radius: 8px;
  overflow: hidden;

  button {
    border: none;
    background: #fff;
    padding: 6px 14px;
    cursor: pointer;
    font-size: 0.9rem;
    color: ${CLUBS_GREY};
  }

  button + button {
    border-left: 1px solid ${ALLBIRDS_GRAY};
  }

  button.is-active {
    background: ${CLUBS_BLUE};
    color: #fff;
  }
`

// whether the application is open now, hasn't opened yet, or has closed
export function applicationState(application: Application): {
  label: string
  detail: string
  tone: ApplicationStatusType
} {
  const now = moment()
  const start = moment(application.application_start_time)
  const end = moment(application.application_end_time)
  const format = (time: moment.Moment) =>
    time.tz('America/New_York').format('MMM D [at] h:mm A')
  if (now.isBefore(start)) {
    return {
      label: 'Scheduled',
      detail: `Opens ${format(start)}`,
      tone: ApplicationStatusType.Pending,
    }
  }
  if (now.isAfter(end)) {
    return {
      label: 'Closed',
      detail: `Closed ${format(end)}`,
      tone: ApplicationStatusType.RejectedWritten,
    }
  }
  return {
    label: 'Open',
    detail: `Closes ${format(end)}`,
    tone: ApplicationStatusType.Accepted,
  }
}

// the answer to a question as plain text
export function answerText(response: ApplicationResponse | undefined): string {
  if (response == null) {
    return ''
  }
  if (response.multiple_choice != null) {
    return response.multiple_choice.value
  }
  if (response.selected_choices?.length) {
    return response.selected_choices.map((choice) => choice.value).join(', ')
  }
  return response.text ?? ''
}

export const questionsUrl = (clubCode: string, applicationId: number) =>
  `/clubs/${clubCode}/applications/${applicationId}/questions/`

// questions applicants answer, in the order they see them
export const answerableQuestions = (questions: ApplicationQuestion[]) =>
  questions.filter(
    (question) => question.question_type !== ApplicationQuestionType.InfoText,
  )

type ConfirmOptions = {
  title: string
  message: ReactNode
  confirmLabel: string
}

/**
 * An in-page replacement for window.confirm. Render the returned dialog
 * somewhere, then `await confirm({...})` to find out what the user picked.
 */
export function useConfirm(): [
  ReactElement | null,
  (options: ConfirmOptions) => Promise<boolean>,
] {
  const [request, setRequest] = useState<
    (ConfirmOptions & { resolve: (confirmed: boolean) => void }) | null
  >(null)

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => setRequest({ ...options, resolve }))

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed)
    setRequest(null)
  }

  const dialog = request && (
    <Modal
      show
      closeModal={() => close(false)}
      width="440px"
      marginBottom={false}
    >
      <div style={{ padding: 24, textAlign: 'left' }}>
        <h3 className="title is-5 mb-3">{request.title}</h3>
        <p className="mb-4">{request.message}</p>
        <div className="buttons is-right">
          <button className="button" onClick={() => close(false)}>
            Cancel
          </button>
          <button className="button is-danger" onClick={() => close(true)}>
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )

  return [dialog, confirm]
}
