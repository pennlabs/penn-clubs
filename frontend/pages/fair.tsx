import {
  Contact,
  Container,
  Icon,
  InfoPageTitle,
  Metadata,
} from 'components/common'
import moment from 'moment-timezone'
import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import renderPage from 'renderPage'
import { ClubFair } from 'types'
import { cache, doApiRequest, useSetting } from 'utils'
import { FAIR_NAME } from 'utils/branding'

import { CLUB_ROUTE, SNOW } from '~/constants'

type FairPageProps = {
  isOverride: boolean
  fair: ClubFair | null
  events: {
    start_time: string
    end_time: string
    events: {
      category: string | null
      events: { name: string; code: string }[]
    }[]
  }[]
}

const FairPage = ({
  events,
  isOverride,
  fair,
}: FairPageProps): ReactElement => {
  const [isFairOpen, setFairOpen] = useState<boolean>(
    useSetting('FAIR_OPEN') as boolean,
  )
  const isPreFair = useSetting('PRE_FAIR')
  const fairName = fair?.name ?? useSetting('FAIR_NAME') ?? 'Upcoming Fair'
  const fairOrgName = fair?.organization ?? 'partner organization'
  const fairContact = fair?.contact ?? 'the partner organization'
  const fairTime = fair?.time ?? 'TBD'
  const fairAdditionalInfo = fair?.information ?? ''

  /**
   * Open up the fair on the designated time client side if we're close.
   * This is in order to reduce the number of frantic refreshes to enter the fair.
   */
  useEffect(() => {
    const remainingTime =
      fair != null
        ? new Date(fair?.start_time).getTime() - new Date().getTime()
        : -1
    if (remainingTime > 0 && remainingTime <= 5 * 60 * 1000) {
      const id = setTimeout(() => {
        setFairOpen(true)
      }, remainingTime)
      return () => clearTimeout(id)
    }
    if (remainingTime < 0 && fair != null && !isFairOpen) {
      setFairOpen(true)
    }
  }, [])

  return (
    <Container background={SNOW}>
      <Metadata title={fairName as string} />
      <InfoPageTitle>{fairName} – Student Guide</InfoPageTitle>
      <div className="content">
        {!isPreFair && !isFairOpen && !isOverride && (
          <div className="notification is-warning">
            <Icon name="alert-triangle" /> There is currently no {FAIR_NAME}{' '}
            fair that is currently occurring or upcoming. If you believe this is
            an error, please contact <Contact />.
          </div>
        )}

        <p>
          The 2023 Fall Activities Fair sponsored by the Student Activities
          Council(SAC), will be held from August 29th to August 31st! This event
          will showcase various student-run clubs, with each day dedicated to
          highlighting different club categories. The fair will take place on
          College Green from 12p-4p each day.
        </p>
        <p>
          To participate, sign-up will be facilitated through Penn Clubs and
          will coincide with the annual club registration process. Only
          returning undergraduate student-run groups that were registered in
          Penn Clubs last year are eligible to sign-up for the Fall Activities
          Fair.
        </p>
        <p>
          To secure your club’s spot, be sure to register before the deadline on
          August 22nd. Once the registration process is complete, registered
          clubs will receive information about their scheduled day for the Fair
          by August 24th.
        </p>
        <p>
          For any inquiries or clarifications about the Fair, don't hesitate to
          reach out to SAC at fair@sacfunded.net. We look forward to seeing you
          there!
        </p>
        <div className="columns mt-3">
          {events.map(({ start_time, end_time, events }, i): ReactElement => {
            const parsedDate = moment(start_time).tz('America/New_York')
            const endDate = moment(end_time).tz('America/New_York')
            return (
              <div key={i} className="column">
                <div className="mb-3">
                  <b className="has-text-info">
                    {parsedDate.format('LLL')} - {endDate.format('LT z')}
                  </b>
                </div>
                {events.map(({ category, events }) => (
                  <div key={category}>
                    <b>{category}</b>
                    <ul className="mt-0 mb-3">
                      {events.map((event) => (
                        <li key={event.code}>
                          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(event.code)}>
                            {event.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </Container>
  )
}

FairPage.getInitialProps = async ({ req, query }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }

  const json = await cache(
    `events:fair:${query.fair as string}:${query.date as string}`,
    async () => {
      const resp = await doApiRequest(
        `/events/fair/?date=${query.date as string}&fair=${
          query.fair as string
        }&format=json`,
        data,
      )
      return await resp.json()
    },
    5 * 60 * 1000,
  )

  return {
    events: json.events,
    isOverride: !!(query.date || query.fair),
    fair: json.fair,
  }
}

export default renderPage(FairPage)
