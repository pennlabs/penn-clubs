import moment from 'moment-timezone'

import { UserApplication, UserApplicationSubmission } from '~/types'

/**
 * Mirrors ClubApplication.season so the client buckets past applications the
 * same way the server labels them. Note the shared quirk: anything starting
 * before August is called Spring, so summer applications land in the wrong
 * season on both sides.
 */
export const currentSeason = (): string => {
  const now = moment()
  return `${now.month() + 1 >= 8 ? 'Fall' : 'Spring'} ${now.year()}`
}

export const matches = (
  application: UserApplication,
  query: string,
): boolean => {
  if (!query) return true
  const haystack = [
    application.name,
    application.club_name,
    // both the committees on offer and the ones actually applied to
    ...application.committees,
    ...application.submissions.map((submission) => submission.committee),
  ]
    .join(' ')
    .toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

export const byDeadlineAsc = (a: UserApplication, b: UserApplication): number =>
  moment(a.effective_end_time).valueOf() -
  moment(b.effective_end_time).valueOf()

export const byDeadlineDesc = (
  a: UserApplication,
  b: UserApplication,
): number => -byDeadlineAsc(a, b)

export type Buckets = {
  actionNeeded: UserApplication[]
  submitted: UserApplication[]
  closed: UserApplication[]
  past: UserApplication[]
}

export const bucketApplications = (
  applications: UserApplication[],
  query: string,
): Buckets => {
  const season = currentSeason()
  const visible = applications.filter((a) => matches(a, query))
  return {
    actionNeeded: visible
      .filter((a) => a.is_open && a.submissions.length === 0)
      .sort(byDeadlineAsc),
    submitted: visible
      .filter((a) => a.is_open && a.submissions.length > 0)
      .sort(byDeadlineAsc),
    closed: visible
      .filter((a) => !a.is_open && a.season === season)
      .sort(byDeadlineDesc),
    past: visible
      .filter((a) => !a.is_open && a.season !== season)
      .sort(byDeadlineDesc),
  }
}

/**
 * Deep-link to the submission this row represents, so Edit reopens the right
 * committee instead of the applicant reselecting it every time.
 */
export const editHref = (
  application: UserApplication,
  submission: UserApplicationSubmission,
): string =>
  application.committees.includes(submission.committee)
    ? `${application.application_link}?committee=${encodeURIComponent(
        submission.committee,
      )}`
    : application.application_link

/** Where an untouched application sends you to start. */
export const applyHref = (application: UserApplication): string =>
  application.external_url ?? application.application_link

export const progressPercent = (
  submission: UserApplicationSubmission,
): number =>
  submission.questions_total > 0
    ? Math.round(
        (submission.questions_answered / submission.questions_total) * 100,
      )
    : 0
