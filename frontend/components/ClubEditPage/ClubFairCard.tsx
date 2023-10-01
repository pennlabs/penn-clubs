import { Field, Form, Formik } from 'formik'
import Link from 'next/link'
import React, { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { CLUB_EDIT_ROUTE } from '../../constants'
import {
  Club,
  ClubFair,
  DynamicQuestion,
  MembershipRank,
  UserMembership,
} from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_PLURAL, OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Contact, Icon, Text } from '../common'
import { RichTextField, TextField } from '../FormComponents'
import BaseCard from './BaseCard'

type ClubFairCardProps = {
  club?: Club
  fairs?: ClubFair[]
  memberships?: UserMembership[]
}

const DynamicQuestions = ({
  questions,
}: {
  questions: DynamicQuestion[]
}): ReactElement => {
  return (
    <>
      {questions.map((question) => (
        <Field
          key={question.name}
          as={question.type === 'html' ? RichTextField : TextField}
          {...question}
        />
      ))}
    </>
  )
}

const ClubFairCard = ({
  club,
  fairs: initialFairs,
  memberships: initialMemberships,
}: ClubFairCardProps): ReactElement => {
  const [fairs, setFairs] = useState<ClubFair[]>(initialFairs ?? [])
  const [fairStatuses, setFairStatuses] = useState<number[]>(club?.fairs ?? [])
  const [isLoading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<[number, string] | null>(null)

  const [clubList, setClubList] = useState<UserMembership[]>(
    initialMemberships ?? [],
  )

  const fetchFairs = (): void => {
    doApiRequest('/clubfairs/?format=json')
      .then((resp) => resp.json())
      .then(setFairs)
  }

  const register = (
    fairId: number,
    status: boolean,
    data?: { [key: string]: string },
  ): void => {
    setLoading(true)
    const answers: string[] = []
    if (data != null) {
      const questions = JSON.parse(
        fairs.find(({ id }) => id === fairId)?.questions ?? '[]',
      )
      questions.forEach((question: DynamicQuestion) => {
        answers.push(data[question.name])
      })
    }
    doApiRequest(
      `/clubfairs/${encodeURIComponent(fairId)}/register/?format=json`,
      { method: 'POST', body: { club: club?.code, status, answers } },
    )
      .then((resp) => resp.json())
      .then((data) => {
        if (data.success) {
          if (status) {
            setFairStatuses([...fairStatuses, fairId])
          } else {
            const newStatuses = [...fairStatuses]
            newStatuses.splice(newStatuses.indexOf(fairId), 1)
            setFairStatuses(newStatuses)
          }
        }
        if (data.message) {
          setMessage([fairId, data.message])
        } else {
          setMessage(null)
        }
      })
      .then(fetchFairs)
      .finally(() => setLoading(false))
  }

  useEffect((): void => {
    initialFairs || fetchFairs()

    // in the case where no specific club is passed, show a list of eligible clubs
    if (club == null || !initialMemberships) {
      doApiRequest('/memberships/?format=json')
        .then((resp) => resp.json())
        .then(setClubList)
    }
  }, [])

  const availableClubs = clubList.filter(
    ({ role }) => role <= MembershipRank.Officer,
  )

  return (
    <BaseCard title="Activity Fairs">
      <Text>
        You can indicate your {OBJECT_NAME_SINGULAR}'s interest in participating
        in the upcoming {OBJECT_NAME_SINGULAR} activity fairs using the form
        below.
      </Text>
      {fairs.map((fair) => {
        const isRegistered = fairStatuses.indexOf(fair.id) !== -1
        const registrationEnd = new Date(fair.registration_end_time)
        const registrationStart =
          fair.registration_start_time != null
            ? new Date(fair.registration_start_time)
            : null
        const now = new Date().getTime()
        const isEnded = now > registrationEnd.getTime()
        const hasStarted =
          registrationStart == null || now > registrationStart.getTime()

        return (
          <div key={fair.id} className="box">
            <h4 className="title is-4 mb-0">{fair.name}</h4>
            <Text>
              {fair.organization} (<Contact email={fair.contact} />) -{' '}
              {fair.time}
            </Text>
            <div className="content">
              <div
                dangerouslySetInnerHTML={{
                  __html: fair.registration_information,
                }}
              />
            </div>
            {club != null && (
              <Text>
                {club.name} is{' '}
                <b
                  className={
                    isRegistered ? 'has-text-success' : 'has-text-danger'
                  }
                >
                  {isRegistered ? 'registered' : 'not registered'}
                </b>{' '}
                for this {OBJECT_NAME_SINGULAR} fair.{' '}
                {!isEnded && (
                  <>
                    Registration will close on{' '}
                    <b>{registrationEnd.toLocaleString()}</b> (
                    <TimeAgo date={registrationEnd} />
                    ). You can change your status any time before that date.
                  </>
                )}
              </Text>
            )}
            {message != null && message[0] === fair.id && (
              <div className="notification is-info">{message[1]}</div>
            )}
            {isEnded ? (
              <Text>
                Registration for this {OBJECT_NAME_SINGULAR} fair is now closed.
                If you have any questions, please contact{' '}
                <Contact email={fair.contact} />.
              </Text>
            ) : hasStarted ? (
              club != null ? (
                <>
                  {isRegistered ? (
                    <button
                      onClick={() => register(fair.id, false)}
                      className="button is-danger"
                      disabled={isLoading}
                    >
                      <Icon name="x" /> Unregister
                    </button>
                  ) : (
                    <>
                      <Formik
                        initialValues={{}}
                        onSubmit={(data) => register(fair.id, true, data)}
                      >
                        <Form>
                          <DynamicQuestions
                            questions={JSON.parse(fair.questions)}
                          />
                          <button
                            type="submit"
                            className="button is-primary"
                            disabled={isLoading}
                          >
                            <Icon name="edit" /> Register
                          </button>
                        </Form>
                      </Formik>
                    </>
                  )}
                </>
              ) : (
                <>
                  <table className="table is-fullwidth">
                    <thead>
                      <tr>
                        <th>Club</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableClubs.length > 0 ? (
                        availableClubs.map((item) => (
                          <tr key={item.club.code}>
                            <td>{item.club.name}</td>
                            <td>
                              <Link
                                href={CLUB_EDIT_ROUTE()}
                                as={
                                  CLUB_EDIT_ROUTE(item.club.code) + '/settings'
                                }
                                className="button is-small"
                              >
                                Register
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2}>
                            There are no {OBJECT_NAME_PLURAL} that you can
                            register.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )
            ) : (
              <>
                Registration for this {OBJECT_NAME_SINGULAR} has not yet opened.
                Registration will open on{' '}
                <b>{registrationStart?.toLocaleString()}</b> (
                <TimeAgo date={registrationStart} />
                ).
              </>
            )}
          </div>
        )
      })}
      {fairs.length <= 0 && (
        <div className="has-text-grey">
          There are no upcoming {OBJECT_NAME_SINGULAR} fairs at this time.
        </div>
      )}
    </BaseCard>
  )
}

export default ClubFairCard
