import Link from 'next/link'
import React, { ReactElement, useEffect, useState } from 'react'

import { doApiRequest } from '~/utils'

import { Application, ApplicationQuestionType } from '../../types'
import {
  FAIR_NAME,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from '../../utils/branding'
import { Icon, Loading, Text } from '../common'
import { ColumnTooltip } from './ClubTabTable'

type Props = {
  applications?: Application[]
}

type Row = {
  applicationId: number
  club: string
  clubName: string
  committee: string
  startTime: string
  endTime: string
  wordCount: number
}

const BoolIndicator = ({ value }: { value: boolean }): ReactElement => {
  return (
    <span className={value ? 'has-text-success' : 'has-text-danger'}>
      <Icon name={value ? 'check' : 'x'} />
    </span>
  )
}

const WhartonApplicationTab = ({
  applications: initialApplications,
}: Props): ReactElement => {
  const WHARTON_APPLICATION_MAX_WORDS = 500
  const [applications, setApplications] = useState<
    Application[] | { detail: string } | null
  >(initialApplications ?? null)

  if (applications == null) {
    return <Loading />
  }

  if ('detail' in applications) {
    return <Text>{applications.detail}</Text>
  }

  const [rows, setRows] = useState<Row[] | null>(
    initialApplications != null ? applicationToRow(initialApplications) : null,
  )

  function applicationToRow(applications: Application[]): Row[] {
    return applications
      .flatMap((application) => {
        if (application.committees == null) {
          return null
        } else if (application.committees.length === 0) {
          // if there are no committees just use 'General Member' as a placeholder
          application.committees.push({ name: 'General Member' })
        }
        return application.committees.map((committee) => {
          // filter to get only the questions that contribute to this committee
          // namely: all free response questions that either belong to no
          // committee or belong to the committee in question
          const committeeQuestions = application.questions.filter(
            (question) => {
              if (
                question.question_type !== ApplicationQuestionType.FreeResponse
              ) {
                return false
              }
              if (question.committee_question === false) {
                return true
              } else {
                if (
                  question.committees.find(
                    (questionCommittee) =>
                      questionCommittee.name === committee.name,
                  )
                ) {
                  return true
                }
              }
              return false
            },
          )
          const wordCount = committeeQuestions.reduce(
            (acc, question) => acc + question.word_limit,
            0,
          )
          return {
            applicationId: application.id,
            club: application.club,
            clubName: application.name,
            committee: committee.name,
            startTime: application.application_start_time,
            endTime: application.application_end_time,
            wordCount: wordCount,
          }
        })
      })
      .filter((item) => item != null) as Row[]
  }

  useEffect(() => {
    if (applications == null) {
      doApiRequest('/whartonapplications/?format=json')
        .then((resp) => resp.json())
        .then((data) => {
          setApplications(data)
          setRows(applicationToRow(data))
        })
    }
  }, [applications])

  if (rows == null) {
    return <Loading />
  }

  return (
    <>
      <Text>
        This is a dashboard where you can view the status and events for all
        registered {OBJECT_NAME_PLURAL} for an {FAIR_NAME} fair. Only users with
        the required permissions can view this page.
      </Text>
      {rows != null && rows.length > 0 ? (
        <div className="content">
          <table className="table is-hoverable">
            <thead>
              <tr>
                <th>{OBJECT_NAME_TITLE_SINGULAR} (committee)</th>
                <th>
                  Start Time{' '}
                  <ColumnTooltip
                    tip={`Shows whether or not an event has been created for this ${OBJECT_NAME_SINGULAR}. Only ${SITE_NAME} administrators can do this.`}
                  />
                </th>
                <th>
                  End Time{' '}
                  <ColumnTooltip
                    tip={`Shows whether or not an event has been created for this ${OBJECT_NAME_SINGULAR}. Only ${SITE_NAME} administrators can do this.`}
                  />
                </th>
                <th>
                  Word Count{' '}
                  <ColumnTooltip
                    tip={`Shows whether or not the meeting link has been properly configured. Only ${OBJECT_NAME_SINGULAR} officers can do this.`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <Link
                      href={`/club/${row.club}/application/${row.applicationId}/`}
                    >
                      {`${row.clubName} (${row.committee})`}
                    </Link>
                  </td>
                  <td>{row.startTime}</td>
                  <td>{row.endTime}</td>
                  <td>
                    {row.wordCount}{' '}
                    <BoolIndicator
                      value={row.wordCount < WHARTON_APPLICATION_MAX_WORDS}
                    ></BoolIndicator>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows != null && rows.length > 0 ? (
        <Loading />
      ) : (
        <Text>There are no {FAIR_NAME} fairs to display.</Text>
      )}
    </>
  )
}

export default WhartonApplicationTab
