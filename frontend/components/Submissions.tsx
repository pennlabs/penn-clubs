import moment from 'moment-timezone'
import Link from 'next/link'
import React, { ReactElement, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import {
  answerText,
  useConfirm,
} from '~/components/ClubEditPage/ApplicationWorkspace/shared'
import { EmptyState, Icon, Modal, Text } from '~/components/common'
import {
  Absolute,
  Actions,
  AppCell,
  AppName,
  Blurb,
  ClubName,
  CommitteeTag,
  Deadline,
  Empty,
  NoneCell,
  Relative,
  Scroll,
  Search,
  Table,
  TagLabel,
  Toolbar,
} from '~/components/Settings/ApplicationsTable/styles'
import { ALLBIRDS_GRAY, MEDIUM_GRAY } from '~/constants'
import { ApplicationSubmission } from '~/types'
import { doApiRequest } from '~/utils'

// a submission as the applicant's submissions endpoint returns it
type Submission = Omit<ApplicationSubmission, 'committee'> & {
  committee: { name: string } | null
  // the application's name, or null once the application is deleted
  name: string | null
}

const Answers = styled.div`
  text-align: left;
  padding: 24px;

  h3 {
    margin-bottom: 4px;
  }

  .answer {
    padding: 12px 0;
    border-top: 1px solid ${ALLBIRDS_GRAY};
  }

  .answer h5 {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .answer p {
    white-space: pre-wrap;
  }

  .none {
    color: ${MEDIUM_GRAY};
  }
`

const eastern = (value: string) => moment(value).tz('America/New_York')

function SubmissionsPage({
  initialSubmissions,
}: {
  initialSubmissions: Array<ApplicationSubmission> | { detail: string }
}): ReactElement<any> {
  if ('detail' in initialSubmissions) {
    return <Text>{initialSubmissions.detail}</Text>
  }

  const [submissions, setSubmissions] = useState<Submission[]>(
    [...(initialSubmissions as unknown as Submission[])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  )
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState<Submission | null>(null)
  const [confirmDialog, confirm] = useConfirm()

  const remove = async (submission: Submission) => {
    const confirmed = await confirm({
      title: 'Delete this submission?',
      message: `Your answers to ${submission.name ?? 'this application'} will be deleted, and the club won't see them.`,
      confirmLabel: 'Delete submission',
    })
    if (!confirmed) {
      return
    }
    const resp = await doApiRequest(
      `/submissions/${submission.pk}/?format=json`,
      {
        method: 'DELETE',
      },
    )
    if (resp.ok) {
      setSubmissions(submissions.filter(({ pk }) => pk !== submission.pk))
    } else {
      toast.error('Could not delete this submission. Please try again.')
    }
  }

  if (submissions.length === 0) {
    return (
      <Empty>
        <EmptyState name="hiring" size="14rem" />
        <Text>You haven't submitted any applications yet.</Text>
        <Link href="/clubs" className="button is-primary">
          Browse clubs
        </Link>
      </Empty>
    )
  }

  const shown = submissions.filter((submission) =>
    `${submission.name} ${submission.club} ${submission.committee?.name ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  return (
    <>
      <Blurb>
        Everything you've submitted. Clubs only read your latest version, so you
        can keep editing until the deadline.
      </Blurb>
      <Toolbar>
        <Text className="mb-0">
          {submissions.length} submission{submissions.length === 1 ? '' : 's'}
        </Text>
        <Search>
          <span>
            <Icon name="search" alt="search" size="0.9rem" />
          </span>
          <input
            className="input"
            type="text"
            value={query}
            placeholder="Search submissions"
            aria-label="Search submissions"
            onChange={(e) => setQuery(e.target.value)}
          />
        </Search>
      </Toolbar>

      <Scroll>
        <Table>
          <colgroup>
            <col style={{ width: '36%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '26%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Application</th>
              <th>Committee</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((submission) => {
              const sent = eastern(submission.created_at)
              return (
                <tr key={submission.pk}>
                  <td>
                    <AppCell>
                      <AppName>{submission.name ?? '(removed)'}</AppName>
                      {submission.code ? (
                        <Link href={`/club/${submission.code}`}>
                          <ClubName>{submission.club}</ClubName>
                        </Link>
                      ) : (
                        <ClubName>{submission.club ?? '(removed)'}</ClubName>
                      )}
                    </AppCell>
                  </td>
                  <td>
                    {submission.committee ? (
                      <CommitteeTag title={submission.committee.name}>
                        <TagLabel>{submission.committee.name}</TagLabel>
                      </CommitteeTag>
                    ) : (
                      <NoneCell>&mdash;</NoneCell>
                    )}
                  </td>
                  <td>
                    <Deadline>
                      <Relative>{sent.format('MMM D')}</Relative>
                      <Absolute>{sent.format('h:mm A')}</Absolute>
                    </Deadline>
                  </td>
                  <td>
                    <Actions>
                      <button
                        className="button is-small"
                        onClick={() => setViewing(submission)}
                      >
                        View
                      </button>
                      <a
                        className="button is-small"
                        href={submission.application_link}
                      >
                        <Icon name="edit" alt="" size="0.8rem" />
                        Edit
                      </a>
                      <button
                        className="button is-small is-danger is-outlined"
                        title="Delete submission"
                        onClick={() => remove(submission)}
                      >
                        <Icon name="trash" alt="delete" size="0.8rem" />
                      </button>
                    </Actions>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Scroll>

      {confirmDialog}
      {viewing && (
        <Modal
          show
          closeModal={() => setViewing(null)}
          width="640px"
          marginBottom={false}
        >
          <Answers>
            <h3 className="title is-4">{viewing.name}</h3>
            <p className="mb-4 none">
              {[viewing.club, viewing.committee?.name]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {viewing.responses.map((response) => {
              const answer = answerText(response)
              return (
                <div className="answer" key={response.question.id}>
                  <h5>{response.question.prompt}</h5>
                  {answer ? <p>{answer}</p> : <p className="none">No answer</p>}
                </div>
              )
            })}
          </Answers>
        </Modal>
      )}
    </>
  )
}

export default SubmissionsPage
