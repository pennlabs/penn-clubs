import React, { ReactElement, useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'

import { Club, ClubFair } from '../../types'
import { doApiRequest } from '../../utils'
import { OBJECT_NAME_SINGULAR } from '../../utils/branding'
import { Contact, Icon, Text } from '../common'
import BaseCard from './BaseCard'

type ClubFairCardProps = {
  club: Club
}

const ClubFairCard = ({ club }: ClubFairCardProps): ReactElement => {
  const [fairs, setFairs] = useState<ClubFair[]>([])
  const [fairStatuses, setFairStatuses] = useState<number[]>(club.fairs)
  const [isLoading, setLoading] = useState<boolean>(false)

  const fetchFairs = (): void => {
    doApiRequest('/clubfairs/?format=json')
      .then((resp) => resp.json())
      .then(setFairs)
  }

  const register = (fairId: number, status: boolean): void => {
    setLoading(true)
    doApiRequest(
      `/clubfairs/${encodeURIComponent(fairId)}/register/?format=json`,
      { method: 'POST', body: { club: club.code, status } },
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
      })
      .then(fetchFairs)
      .finally(() => setLoading(false))
  }

  useEffect(fetchFairs, [])

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
        const isEnded = new Date().getTime() > registrationEnd.getTime()

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
            {isEnded ? (
              <Text>
                Registration for this {OBJECT_NAME_SINGULAR} fair is now closed.
                If you have any questions, please contact{' '}
                <Contact email={fair.contact} />.
              </Text>
            ) : (
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
                  <button
                    onClick={() => register(fair.id, true)}
                    className="button is-primary"
                    disabled={isLoading}
                  >
                    <Icon name="edit" /> Register
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
      {fairs.length < 0 && (
        <div className="has-text-grey">
          There are no upcoming fairs at this time.
        </div>
      )}
    </BaseCard>
  )
}

export default ClubFairCard
