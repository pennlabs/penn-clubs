import moment from 'moment-timezone'
import Link from 'next/link'
import { ReactElement, useState } from 'react'
import styled from 'styled-components'

import { Icon } from '~/components/common'
import {
  ALLBIRDS_GRAY,
  BORDER,
  CLUBS_BLUE,
  CLUBS_LIGHT_BLUE,
  CLUBS_NAVY,
  MEDIUM_GRAY,
  PROPIC_BACKGROUND,
  PROPIC_TEXT,
} from '~/constants/colors'
import { BORDER_RADIUS } from '~/constants/measurements'
import { CLUB_ROUTE } from '~/constants/routes'
import { UserApplication, UserApplicationSubmission } from '~/types'

import { applyHref, editHref } from './shared'

const Card = styled.div`
  background: white;
  border: 1px solid ${BORDER};
  border-radius: ${BORDER_RADIUS};
  padding: 1rem 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`

const Head = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
`

const Logo = styled.div<{ $bg: string; $fg: string }>`
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: ${BORDER_RADIUS};
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 700;
  overflow: hidden;

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const Titles = styled.div`
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`

const Name = styled.div`
  font-size: 1.0625rem;
  font-weight: 600;
  color: ${CLUBS_NAVY};
  line-height: 1.3;
`

const ClubLine = styled.div`
  font-size: 0.875rem;
  color: ${MEDIUM_GRAY};
`

const Right = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.4rem;
  flex: none;
`

const Muted = styled.span`
  font-size: 0.8125rem;
  color: ${MEDIUM_GRAY};
  text-align: right;
`

const Committees = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.35rem;
`

const Rows = styled.div`
  border-top: 1px solid ${ALLBIRDS_GRAY};
  display: flex;
  flex-direction: column;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding-top: 0.6rem;
  flex-wrap: wrap;

  & + & {
    border-top: 1px solid ${ALLBIRDS_GRAY};
    margin-top: 0.6rem;
  }
`

const Committee = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${CLUBS_NAVY};
  min-width: 128px;
`

const When = styled.span`
  font-size: 0.8125rem;
  color: ${MEDIUM_GRAY};
  min-width: 84px;
`

const Status = styled.span`
  min-width: 190px;
  display: flex;
`

const Note = styled.span`
  font-size: 0.8125rem;
  color: ${MEDIUM_GRAY};
`

const Actions = styled.span`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const Track = styled.span`
  width: 84px;
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

const Progress = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 148px;
  font-size: 0.75rem;
  color: ${MEDIUM_GRAY};
  font-variant-numeric: tabular-nums;
`

/**
 * Bulma's .tag has no gap, and Icon only self-spaces inside .button (see
 * common/Icon.tsx), so a tag with an icon renders the glyph flush against its
 * label. This owns the spacing, height and weight for every status tag.
 */
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

const ExtensionTag = styled(Tag)`
  background: ${CLUBS_LIGHT_BLUE};
  color: ${CLUBS_BLUE};
`

/** Deterministic avatar colours, matching the profile picture palette. */
const paletteFor = (code: string): { bg: string; fg: string } => {
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) >>> 0
  }
  const index = hash % PROPIC_BACKGROUND.length
  return { bg: PROPIC_BACKGROUND[index], fg: PROPIC_TEXT[index] }
}

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || '?'

/**
 * Countdown to the deadline that applies to *this* user, which an extension
 * can push later than the club's own end time.
 */
const deadlinePill = (application: UserApplication): ReactElement<any> => {
  const end = moment(application.effective_end_time)
  const hours = end.diff(moment(), 'hours')
  const relative = end.fromNow(true)
  const Pill = hours < 48 ? DangerTag : hours < 24 * 7 ? WarningTag : Tag
  return (
    <Pill>
      <Icon name="clock" alt="" size="0.85rem" noMargin />
      Closes in {relative}
    </Pill>
  )
}

const outcomePill = (
  application: UserApplication,
  submission: UserApplicationSubmission,
): ReactElement<any> => {
  if (application.is_open) {
    return (
      <InfoTag>
        <Icon name="check" alt="" size="0.85rem" noMargin />
        Submitted
      </InfoTag>
    )
  }
  switch (submission.outcome) {
    case 'accepted':
      return (
        <SuccessTag>
          <Icon name="check" alt="" size="0.85rem" noMargin />
          Accepted
        </SuccessTag>
      )
    case 'rejected_after_written':
      return (
        <DangerTag title="Rejected after written application">
          Not selected
        </DangerTag>
      )
    case 'rejected_after_interview':
      return (
        <DangerTag title="Rejected after interviews">Not selected</DangerTag>
      )
    default:
      return <Tag>No decision posted</Tag>
  }
}

type Props = {
  application: UserApplication
  onViewResponses: (submission: UserApplicationSubmission) => void
  onDelete: (submission: UserApplicationSubmission) => void
}

const ApplicationCard = ({
  application,
  onViewResponses,
  onDelete,
}: Props): ReactElement<any> => {
  const [imageFailed, setImageFailed] = useState<boolean>(false)
  const { bg, fg } = paletteFor(application.club_code)
  const resultsPending =
    !application.is_open &&
    application.submissions.some((s) => !s.outcome_released) &&
    moment(application.result_release_time).isAfter(moment())

  return (
    <Card>
      <Head>
        <Logo $bg={bg} $fg={fg}>
          {application.club_image_url && !imageFailed ? (
            <img
              src={application.club_image_url}
              alt=""
              onError={() => setImageFailed(true)}
            />
          ) : (
            initials(application.club_name)
          )}
        </Logo>
        <Titles>
          <Name>{application.name}</Name>
          <ClubLine>
            <Link href={CLUB_ROUTE(application.club_code)}>
              {application.club_name}
            </Link>
          </ClubLine>
          {application.submissions.length === 0 &&
            (application.committees.length > 0 ||
              application.is_wharton_council) && (
              <Committees>
                {application.is_wharton_council && (
                  <InfoTag>Wharton Council</InfoTag>
                )}
                {application.committees.map((committee) => (
                  <Tag key={committee}>{committee}</Tag>
                ))}
              </Committees>
            )}
        </Titles>
        <Right>
          {application.is_open ? (
            <>
              {deadlinePill(application)}
              <Muted>
                {moment(application.effective_end_time)
                  .tz('America/New_York')
                  .format('ddd, MMM D · h:mm A')}
              </Muted>
            </>
          ) : (
            <Muted>
              Closed{' '}
              {moment(application.application_end_time)
                .tz('America/New_York')
                .format('MMM D, YYYY')}
            </Muted>
          )}
          {application.extension_end_time != null && (
            <ExtensionTag>
              Extended for you &middot;{' '}
              {moment(application.extension_end_time)
                .tz('America/New_York')
                .format('MMM D')}
            </ExtensionTag>
          )}
          {resultsPending && (
            <Muted>
              Results expected{' '}
              {moment(application.result_release_time)
                .tz('America/New_York')
                .format('MMM D')}
            </Muted>
          )}
        </Right>
      </Head>

      <Rows>
        {application.submissions.length === 0 ? (
          <Row>
            <Note>
              {application.external_url
                ? 'Applications for this club are hosted off Penn Clubs.'
                : application.committees.length > 0
                  ? `Not started — pick up to 2 of ${application.committees.length} committees.`
                  : 'You haven’t started this application.'}
            </Note>
            <Actions>
              <a
                href={applyHref(application)}
                target={application.external_url ? '_blank' : undefined}
                rel={
                  application.external_url ? 'noopener noreferrer' : undefined
                }
                className="button is-small"
                style={{
                  background: CLUBS_BLUE,
                  borderColor: 'transparent',
                  color: 'white',
                }}
              >
                Apply
                {application.external_url && (
                  <Icon name="external-link" alt="" size="0.8rem" />
                )}
              </a>
            </Actions>
          </Row>
        ) : (
          application.submissions.map((submission) => {
            const pct =
              submission.questions_total > 0
                ? Math.round(
                    (submission.questions_answered /
                      submission.questions_total) *
                      100,
                  )
                : 0
            return (
              <Row key={submission.pk}>
                <Committee>{submission.committee}</Committee>
                {submission.questions_total > 0 && (
                  <Progress
                    title={`${submission.questions_answered} of ${submission.questions_total} questions answered`}
                  >
                    <Track>
                      <Fill $pct={pct} $done={pct === 100} />
                    </Track>
                    {submission.questions_answered} of{' '}
                    {submission.questions_total}
                  </Progress>
                )}
                <When>
                  {moment(submission.created_at)
                    .tz('America/New_York')
                    .format('MMM D')}
                </When>
                <Status>{outcomePill(application, submission)}</Status>
                <Actions>
                  <button
                    className="button is-small"
                    onClick={() => onViewResponses(submission)}
                  >
                    View
                  </button>
                  {application.is_open && (
                    <>
                      <a
                        href={editHref(application, submission)}
                        className="button is-small"
                      >
                        <Icon name="edit" alt="edit" size="0.8rem" /> Edit
                      </a>
                      <button
                        className="button is-small is-danger is-light"
                        onClick={() => onDelete(submission)}
                      >
                        <Icon name="trash" alt="delete" size="0.8rem" />
                      </button>
                    </>
                  )}
                </Actions>
              </Row>
            )
          })
        )}
      </Rows>
    </Card>
  )
}

export default ApplicationCard
