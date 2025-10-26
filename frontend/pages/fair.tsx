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
import { SUPPORT_EMAIL } from 'utils/branding'

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
}: FairPageProps): ReactElement<any> => {
  const [isFairOpen, setFairOpen] = useState<boolean>(
    useSetting('FAIR_OPEN') as boolean,
  )
  const isPreFair = useSetting('PRE_FAIR')
  const fairName = fair?.name ?? useSetting('FAIR_NAME') ?? 'Upcoming Fair'
  const fairContact =
    fair?.contact ?? useSetting('FAIR_CONTACT') ?? SUPPORT_EMAIL

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

  if (!isPreFair && !isFairOpen && !isOverride) {
    return (
      <Container background={SNOW}>
        <Metadata title="Upcoming Fair Guide" />
        <InfoPageTitle>Upcoming Fair Student Guide</InfoPageTitle>
        <div className="content">
          <div className="notification is-warning">
            <Icon name="alert-triangle" /> There is currently no fair currently
            occurring or upcoming. If you believe this is an error, please
            contact <Contact />.
          </div>
        </div>
      </Container>
    )
  }
  return (
    <Container background={SNOW}>
      <Metadata title={fairName as string} />
      <InfoPageTitle>{fairName} – Student Guide</InfoPageTitle>
      <div className="content">
        {fair ? (
          <>
            <p>
              The {fair.name} sponsored by the {fair.organization}, will be held
              from {fair.start_time.split('T')[0]} to{' '}
              {fair.end_time.split('T')[0]}!
            </p>

            {fair.information.trim().length !== 0 && (
              <div>
                <h3>Student Information</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: fair.information,
                  }}
                />
              </div>
            )}

            <br />

            {fair.registration_information.trim().length !== 0 && (
              <div>
                <h3>Registration Information</h3>
                <div
                  dangerouslySetInnerHTML={{
                    __html: fair.registration_information,
                  }}
                />
              </div>
            )}

            <br />

            <p>
              To secure your club’s spot, be sure to register before the
              deadline on {fair.registration_end_time.split('T')[0]}.
            </p>
            <p>
              For any inquiries or clarifications about the Fair, don't hesitate
              to reach out to {fair.contact}. We look forward to seeing you
              there!
            </p>
          </>
        ) : (
          <p>
            The {fairName} is currently ongoing! Please check with {fairContact}{' '}
            for more information.
          </p>
        )}
        <div className="columns mt-3">
          {events.map(
            ({ start_time, end_time, events }, i): ReactElement<any> => {
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
                            <Link
                              legacyBehavior
                              href={CLUB_ROUTE()}
                              as={CLUB_ROUTE(event.code)}
                            >
                              <a>{event.name}</a>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )
            },
          )}
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
