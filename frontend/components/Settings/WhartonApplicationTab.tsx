import moment from 'moment'
import Link from 'next/link'
import React, { ReactElement, useEffect, useState } from 'react'

import { doApiRequest } from '~/utils'

import { Application, ApplicationQuestionType } from '../../types'
import {
  FAIR_NAME,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
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
  startTime: string
  endTime: string
  updatedTime: string
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

  function formatDateTime(date: string): string {
    return moment(date).format('MM-DD-YYYY HH:mm:ss')
  }

  function applicationToRow(applications: Application[]): Row[] {
    return applications.map((application) => {
      const wordCount = application.questions.reduce(
        (acc, question) =>
          acc + question.question_type === ApplicationQuestionType.FreeResponse
            ? (question.word_limit ?? 0)
            : 0,
        0,
      )
      return {
        applicationId: application.id,
        club: application.club,
        clubName: application.name,
        startTime: formatDateTime(application.application_start_time),
        endTime: formatDateTime(application.application_end_time),
        updatedTime: formatDateTime(application.updated_at),
        wordCount,
      }
    })
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
                <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                <th>
                  Start Time{' '}
                  <ColumnTooltip
                    tip={`Displays the time this ${OBJECT_NAME_SINGULAR} application opens.`}
                  />
                </th>
                <th>
                  End Time{' '}
                  <ColumnTooltip
                    tip={`Displays the time this ${OBJECT_NAME_SINGULAR} application closes.`}
                  />
                </th>
                <th>
                  Updated Time{' '}
                  <ColumnTooltip
                    tip={`Displays the time this ${OBJECT_NAME_SINGULAR} application was most recently updated by club officers.`}
                  />
                </th>
                <th>
                  Word Count{' '}
                  <ColumnTooltip
                    tip={`Displays the sum of all questions that are associated with an application (across all committees).`}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <Link
                      legacyBehavior
                      href={`/club/${row.club}/application/${row.applicationId}/`}
                    >
                      {row.clubName}
                    </Link>
                  </td>
                  <td>{row.startTime}</td>
                  <td>{row.endTime}</td>
                  <td>{row.updatedTime}</td>
                  <td>
                    {row.wordCount}{' '}
                    <BoolIndicator
                      value={row.wordCount <= WHARTON_APPLICATION_MAX_WORDS}
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
