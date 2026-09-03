import moment from 'moment-timezone'
import Link from 'next/link'
import { Fragment, ReactElement, useMemo, useState } from 'react'
import styled from 'styled-components'

import { EmptyState, Icon, Modal, Text } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  CLUBS_NAVY,
  LIGHT_GRAY,
  MEDIUM_GRAY,
} from '~/constants/colors'
import { BORDER_RADIUS } from '~/constants/measurements'
import { CLUB_ROUTE } from '~/constants/routes'
import {
  UserApplication,
  UserApplicationsResponse,
  UserApplicationSubmission,
} from '~/types'
import { doApiRequest } from '~/utils'

import ResponsesModal from './ResponsesModal'
import {
  applyHref,
  bucketApplications,
  editHref,
  progressPercent,
} from './shared'

const Blurb = styled(Text)`
  font-size: 0.9375rem;
  margin-bottom: 1.25rem;
`

/** Filter chips on the left, search on the right, on one line. */
const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`

const Search = styled.div`
  margin-left: auto;
  position: relative;

  & input {
    padding-left: 2.25rem;
    min-width: 15rem;
  }

  & span {
    position: absolute;
    left: 0.7rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${LIGHT_GRAY};
    pointer-events: none;
  }
`

const Chip = styled.button<{ $on?: boolean }>`
  height: 2.2em;
  padding: 0 0.85em;
  border-radius: ${BORDER_RADIUS};
  border: 1px solid ${({ $on }) => ($on ? 'transparent' : '#dbdbdb')};
  background: ${({ $on }) => ($on ? CLUBS_LIGHT_BLUE : 'white')};
  color: ${({ $on }) => ($on ? CLUBS_BLUE : '#4a4a4a')};
  font-weight: ${({ $on }) => ($on ? 600 : 500)};
  font-size: 0.8125rem;
  cursor: pointer;
`

const Scroll = styled.div`
  overflow-x: auto;
`

/**
 * Fixed layout so a column never resizes when the filter changes the mix of
 * action buttons in a cell. Widths are declared once, in Cols below.
 */
const Table = styled.table`
  width: 100%;
  min-width: 56rem;
  table-layout: fixed;
  border-collapse: collapse;
  background: white;
  color: #363636;
  font-size: 0.875rem;

  & th,
  & td {
    border-bottom: 1px solid #dbdbdb;
    padding: 0.65em 0.75em;
    vertical-align: middle;
    text-align: left;
  }

  & thead th {
    border-bottom-width: 2px;
    font-size: 0.6875rem;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: ${MEDIUM_GRAY};
    white-space: nowrap;
  }

  & tbody tr:hover {
    background: #fafcff;
  }
`

/** Shared by the main table and the past-applications table. */
const Cols = (): ReactElement<any> => (
  <colgroup>
    <col style={{ width: '24%' }} />
    <col style={{ width: '17%' }} />
    <col style={{ width: '15%' }} />
    <col style={{ width: '14%' }} />
    <col style={{ width: '16%' }} />
    <col style={{ width: '14%' }} />
  </colgroup>
)

const AppCell = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`

const AppName = styled.span`
  font-weight: 600;
  color: ${CLUBS_NAVY};
`

const ClubName = styled.span`
  font-size: 0.8125rem;
  color: ${MEDIUM_GRAY};
`

const NoneCell = styled.span`
  color: ${LIGHT_GRAY};
`

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2em;
  padding: 0 0.75em;
  border-radius: ${BORDER_RADIUS};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  background: ${ALLBIRDS_GRAY};
  color: ${MEDIUM_GRAY};

  & svg {
    margin: 0;
  }
`

/**
 * The committee a submission belongs to. A label, not a link — the Edit button
 * in the same row already goes to that committee's form.
 */
const CommitteeTag = styled(Tag)`
  background: ${CLUBS_LIGHT_BLUE};
  color: ${CLUBS_BLUE};
`

const DangerTag = styled(Tag)`
  background: #feecf0;
  color: #cc0f35;
`

const WarningTag = styled(Tag)`
  background: #fffaeb;
  color: #946c00;
`

const InfoTag = styled(Tag)`
  background: #eff5fb;
  color: #296fa8;
`

const SuccessTag = styled(Tag)`
  background: #effaf5;
  color: #257953;
`

/** Status tag with the submitted date beneath it. */
const StatusCell = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
`

const Deadline = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  white-space: nowrap;
`

const Relative = styled.span<{ $tone?: string }>`
  font-weight: 600;
  color: ${({ $tone }) => $tone ?? '#363636'};
`

const Absolute = styled.span`
  font-size: 0.75rem;
  color: ${LIGHT_GRAY};
`

const Progress = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${MEDIUM_GRAY};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const Track = styled.span`
  width: 64px;
  height: 5px;
  border-radius: 3px;
  background: #e6e9f2;
  overflow: hidden;
  flex: none;
`

const Fill = styled.span<{ $pct: number; $done: boolean }>`
  display: block;
  height: 100%;
  border-radius: 3px;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $done }) => ($done ? '#3eaa6d' : CLUBS_BLUE)};
`

const Actions = styled.span`
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  white-space: nowrap;
`

/**
 * Rows inside one application are separated with a hairline; the last row of
 * each application keeps the full rule, so a two-committee application still
 * reads as one block.
 */
const Row = styled.tr<{ $last?: boolean }>`
  & > td {
    border-bottom-color: ${({ $last }) => ($last ? '#dbdbdb' : '#f1f3f7')};
  }
`

const OtherCommittees = styled.span`
  font-size: 0.75rem;
  color: ${LIGHT_GRAY};
  margin-top: 0.15rem;
`

const Disclosure = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid ${ALLBIRDS_GRAY};
  color: ${MEDIUM_GRAY};
  cursor: pointer;
  user-select: none;
`

const DiscTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`

const PastTable = styled.div`
  margin-top: 1rem;
`

const Empty = styled.div`
  background: white;
  border: 1px solid ${BORDER};
  border-radius: ${BORDER_RADIUS};
  padding: 2.5rem;
  text-align: center;
`

type Filter = 'all' | 'action' | 'open' | 'closed'

const eastern = (value: string) => moment(value).tz('America/New_York')

/**
 * "Sep 8" this year, "Sep 8, 2025" otherwise. Past cycles are a year or more
 * old, so a bare month and day there reads as though it just happened.
 */
const day = (m: moment.Moment): string =>
  m.year() === moment().tz('America/New_York').year() ? 'MMM D' : 'MMM D, YYYY'

/** "Submitted Sep 8" — the date this committee's submission was sent. */
const submittedOn = (submission: UserApplicationSubmission): string => {
  const sent = eastern(submission.created_at)
  return `Submitted ${sent.format(day(sent))}`
}

const deadlineCell = (application: UserApplication): ReactElement<any> => {
  const end = eastern(application.effective_end_time)
  if (!application.is_open) {
    const release = eastern(application.result_release_time)
    return (
      <Deadline>
        <Relative $tone={LIGHT_GRAY}>Closed {end.format(day(end))}</Relative>
        {application.extension_end_time == null &&
          release.isAfter(moment()) && (
            <Absolute>Results expected {release.format(day(release))}</Absolute>
          )}
      </Deadline>
    )
  }
  const hours = end.diff(moment(), 'hours')
  const tone = hours < 48 ? '#cc0f35' : hours < 24 * 7 ? '#946c00' : undefined
  return (
    <Deadline>
      <Relative $tone={tone}>In {end.fromNow(true)}</Relative>
      <Absolute>
        {application.extension_end_time != null
          ? `Extended for you · ${end.format(day(end))}`
          : end.format(`${day(end)}, h:mm A`)}
      </Absolute>
    </Deadline>
  )
}

const statusTag = (
  application: UserApplication,
  submission: UserApplicationSubmission,
): ReactElement<any> => {
  // The submitted date has no column of its own, and it belongs to the
  // committee rather than the application, so it cannot ride the row-spanning
  // Deadline cell. The tooltip is the one per-row place left for it.
  const sent = eastern(submission.created_at)
  const submitted = `Submitted ${sent.format(`${day(sent)}, h:mm A`)}`

  if (application.is_open) {
    // Editability is carried by the Edit button and the live deadline beside
    // it, and stated once in the blurb above the table — the tag does not need
    // to repeat it a third time.
    return (
      <InfoTag
        title={`${submitted}. You can still change it until the deadline.`}
      >
        Submitted
      </InfoTag>
    )
  }
  switch (submission.outcome) {
    case 'accepted':
      return <SuccessTag title={submitted}>Accepted</SuccessTag>
    case 'rejected_after_written':
      return (
        <DangerTag title={`Rejected after written application. ${submitted}`}>
          Not selected
        </DangerTag>
      )
    case 'rejected_after_interview':
      return (
        <DangerTag title={`Rejected after interviews. ${submitted}`}>
          Not selected
        </DangerTag>
      )
    default:
      return <Tag title={submitted}>No decision posted</Tag>
  }
}

type Props = {
  initialData: UserApplicationsResponse | { detail: string }
}

const ApplicationsTable = ({ initialData }: Props): ReactElement<any> => {
  const [data, setData] = useState(initialData)
  const [query, setQuery] = useState<string>('')
  const [filter, setFilter] = useState<Filter>('all')
  const [showPast, setShowPast] = useState<boolean>(true)
  const [viewing, setViewing] = useState<{
    application: UserApplication
    submission: UserApplicationSubmission
  } | null>(null)

  const isError = 'detail' in data
  const applications: UserApplication[] = isError
    ? []
    : (data as UserApplicationsResponse).results
  const savedClubCount = isError
    ? 0
    : (data as UserApplicationsResponse).saved_club_count

  const buckets = useMemo(
    () => bucketApplications(applications, query),
    [applications, query],
  )

  const rows = useMemo(() => {
    const current = [
      ...buckets.actionNeeded,
      ...buckets.submitted,
      ...buckets.closed,
    ]
    return filter === 'action'
      ? buckets.actionNeeded
      : filter === 'open'
        ? [...buckets.actionNeeded, ...buckets.submitted]
        : filter === 'closed'
          ? buckets.closed
          : current
  }, [buckets, filter])

  const removeSubmission = (submission: UserApplicationSubmission): void => {
    if (
      !confirm('Are you sure you want to permanently delete this submission?')
    ) {
      return
    }
    doApiRequest(`/submissions/${submission.pk}/?format=json`, {
      method: 'DELETE',
    }).then(() => {
      setViewing(null)
      setData((previous) => {
        if ('detail' in previous) return previous
        return {
          ...previous,
          results: previous.results.map((application) => ({
            ...application,
            submissions: application.submissions.filter(
              (existing) => existing.pk !== submission.pk,
            ),
          })),
        }
      })
    })
  }

  /**
   * One <tr> per submission, with the application and deadline cells spanning
   * them, so a multi-committee application still reads as one block and every
   * column stays aligned across rows.
   */
  const renderApplication = (
    application: UserApplication,
  ): ReactElement<any> => {
    const applied = application.submissions.map((s) => s.committee)
    const notApplied = application.committees.filter(
      (committee) => !applied.includes(committee),
    )
    // an untouched application still needs a single row, so stand in with null
    const entries: (UserApplicationSubmission | null)[] =
      application.submissions.length > 0 ? application.submissions : [null]

    return (
      <Fragment key={application.id}>
        {entries.map((submission, position) => (
          <Row
            key={submission == null ? 'none' : submission.pk}
            $last={position === entries.length - 1}
          >
            {position === 0 && (
              <>
                <td rowSpan={entries.length}>
                  <AppCell>
                    <AppName>{application.name}</AppName>
                    <ClubName>
                      <Link href={CLUB_ROUTE(application.club_code)}>
                        {application.club_name}
                      </Link>
                    </ClubName>
                    {application.is_open && notApplied.length > 0 && (
                      <OtherCommittees>
                        {applied.length > 0
                          ? `You have not applied to: ${notApplied.join(', ')}`
                          : `Committees: ${notApplied.join(', ')}`}
                      </OtherCommittees>
                    )}
                  </AppCell>
                </td>
                <td rowSpan={entries.length}>{deadlineCell(application)}</td>
              </>
            )}
            <td>
              {submission == null || application.committees.length === 0 ? (
                // "General Member" is a display fallback for a null committee,
                // so naming it here would imply the application has a
                // committee it does not have
                <NoneCell>&mdash;</NoneCell>
              ) : (
                <CommitteeTag>{submission.committee}</CommitteeTag>
              )}
            </td>
            <td>
              {submission == null ? (
                <NoneCell>&mdash;</NoneCell>
              ) : (
                (() => {
                  const pct = progressPercent(submission)
                  return (
                    <Progress>
                      <Track>
                        <Fill $pct={pct} $done={pct === 100} />
                      </Track>
                      {submission.questions_answered} of{' '}
                      {submission.questions_total}
                    </Progress>
                  )
                })()
              )}
            </td>
            <td>
              {submission == null ? (
                application.is_open ? (
                  moment(application.effective_end_time).diff(
                    moment(),
                    'hours',
                  ) < 48 ? (
                    <DangerTag>Not started</DangerTag>
                  ) : (
                    <WarningTag>Not started</WarningTag>
                  )
                ) : (
                  <Tag>Not submitted</Tag>
                )
              ) : (
                <StatusCell>
                  {statusTag(application, submission)}
                  <Absolute>{submittedOn(submission)}</Absolute>
                </StatusCell>
              )}
            </td>
            <td>
              <Actions>
                {submission == null ? (
                  <a
                    href={applyHref(application)}
                    target={application.external_url ? '_blank' : undefined}
                    rel={
                      application.external_url
                        ? 'noopener noreferrer'
                        : undefined
                    }
                    className="button is-small"
                    style={{
                      background: CLUBS_BLUE,
                      borderColor: 'transparent',
                      color: 'white',
                    }}
                  >
                    Apply
                  </a>
                ) : (
                  <>
                    <button
                      className="button is-small"
                      onClick={() => setViewing({ application, submission })}
                    >
                      View
                    </button>
                    {application.is_open && (
                      <a
                        href={editHref(application, submission)}
                        className="button is-small"
                      >
                        <Icon name="edit" alt="" size="0.8rem" />
                        Edit
                      </a>
                    )}
                  </>
                )}
              </Actions>
            </td>
          </Row>
        ))}
      </Fragment>
    )
  }

  const header = (
    <thead>
      <tr>
        <th>Application</th>
        <th>Deadline</th>
        <th>Committee</th>
        <th>Questions</th>
        <th>Status</th>
        <th />
      </tr>
    </thead>
  )

  if (isError) {
    return <Text>{(data as { detail: string }).detail}</Text>
  }

  if (applications.length === 0) {
    return (
      <Empty>
        <EmptyState name="hiring" size="14rem" />
        {savedClubCount > 0 ? (
          <Text>
            None of the {savedClubCount} clubs you follow are accepting
            applications right now. We&apos;ll list them here as they open.
          </Text>
        ) : (
          <>
            <Text>
              Bookmark or subscribe to a club and its application will appear
              here while it&apos;s open.
            </Text>
            <Link href="/clubs" className="button is-primary">
              Browse clubs
            </Link>
          </>
        )}
      </Empty>
    )
  }

  return (
    <>
      <Blurb>
        Bookmark (<Icon name="bookmark" alt="bookmark" size="0.9rem" />) or
        subscribe (<Icon name="bell" alt="subscribe" size="0.9rem" />) to a club
        to see its open applications here, alongside the ones you have already
        submitted.
        <br />
        You can keep editing an application until its deadline. Clubs only read
        your latest version.
      </Blurb>

      <Toolbar>
        {(
          [
            [
              'all',
              'All',
              buckets.actionNeeded.length +
                buckets.submitted.length +
                buckets.closed.length,
            ],
            ['action', 'Needs action', buckets.actionNeeded.length],
            [
              'open',
              'Open',
              buckets.actionNeeded.length + buckets.submitted.length,
            ],
            ['closed', 'Closed', buckets.closed.length],
          ] as [Filter, string, number][]
        ).map(([key, label, count]) => (
          <Chip key={key} $on={filter === key} onClick={() => setFilter(key)}>
            {label} {count}
          </Chip>
        ))}
        <Search>
          <span>
            <Icon name="search" alt="search" size="0.9rem" />
          </span>
          <input
            className="input"
            type="text"
            value={query}
            placeholder="Search applications"
            aria-label="Search applications"
            onChange={(e) => setQuery(e.target.value)}
          />
        </Search>
      </Toolbar>

      <Scroll>
        <Table>
          <Cols />
          {header}
          <tbody>{rows.map(renderApplication)}</tbody>
        </Table>
      </Scroll>

      {buckets.past.length > 0 && (
        <>
          <Disclosure onClick={() => setShowPast(!showPast)}>
            <Icon
              name={showPast ? 'chevron-down' : 'chevron-right'}
              alt=""
              size="0.9rem"
            />
            <DiscTitle>Past applications</DiscTitle>
            <Tag>{buckets.past.length}</Tag>
            <Absolute>Earlier seasons</Absolute>
          </Disclosure>
          {showPast && (
            <PastTable>
              <Scroll>
                <Table>
                  <Cols />
                  {header}
                  <tbody>{buckets.past.map(renderApplication)}</tbody>
                </Table>
              </Scroll>
            </PastTable>
          )}
        </>
      )}

      {viewing != null && (
        <Modal
          show={true}
          closeModal={() => setViewing(null)}
          width="45rem"
          marginBottom={false}
        >
          <ResponsesModal
            application={viewing.application}
            submission={viewing.submission}
            onDelete={() => removeSubmission(viewing.submission)}
            onClose={() => setViewing(null)}
          />
        </Modal>
      )}
    </>
  )
}

export default ApplicationsTable
