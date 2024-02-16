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
import TimeAgo from 'react-timeago'
import renderPage from 'renderPage'
import { ClubFair } from 'types'
import { cache, doApiRequest, useSetting } from 'utils'
import {
  FAIR_NAME,
  OBJECT_NAME_LONG_PLURAL,
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from 'utils/branding'

import { CLUB_ROUTE, LIVE_EVENTS, SNOW } from '~/constants'

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
          <b>Hi there! Welcome to {SITE_NAME}!</b> We are the official platform
          for {OBJECT_NAME_LONG_PLURAL} on campus, and we are excited to get you
          connected to {OBJECT_NAME_PLURAL} on our platform this year. In
          collaboration with {fairOrgName}, we will be hosting the fair for this
          semester. Below is some important information that will set you up for
          a successful experience.
        </p>
        <p>
          <b>How the {fairName} will be run:</b>
        </p>
        <ul>
          <li>
            The {fairName} will be held on <b>{fairTime}</b>.
          </li>
          <li>
            You can visit each {OBJECT_NAME_SINGULAR}'s individual page. Each{' '}
            {OBJECT_NAME_SINGULAR}'s page has a description, contact
            information, and a FAQ feature that {OBJECT_NAME_SINGULAR} officers
            will be monitoring throughout the fair that you can use to ask
            questions. Questions can be submitted anonymously.
          </li>
          <li>
            To keep track of {OBJECT_NAME_PLURAL} you are interested in, we
            encourage you to use some of the tools on our platform!
            <ul>
              <li>
                The{' '}
                <b>
                  <Icon name="bookmark" /> Bookmark
                </b>{' '}
                button will allow you to save a {OBJECT_NAME_SINGULAR} for later
                for your own personal reference. {OBJECT_NAME_TITLE} will not be
                able to see your contact information unless you have allowed it.
              </li>
              <li>
                The{' '}
                <b>
                  <Icon name="bell" /> Subscribe
                </b>{' '}
                button will put your name on a {OBJECT_NAME_SINGULAR}'s mailing
                list. {OBJECT_NAME_TITLE_SINGULAR}
                officers can use this list to send you updates on their upcoming
                events, newsletters, information, and more.
              </li>
            </ul>
          </li>
        </ul>
        <p>
          <b>Contact:</b>
        </p>
        <ul>
          <li>
            If you have any questions or concerns regarding the {fairName},
            please contact <Contact email={fairContact as string} />.
          </li>
          <li>
            If you have any questions or concerns regarding the {SITE_NAME}{' '}
            platform, please contact <Contact />.
          </li>
        </ul>
        {fairAdditionalInfo && !!(fairAdditionalInfo as string).length && (
          <p>
            <div
              dangerouslySetInnerHTML={{ __html: fairAdditionalInfo as string }}
            />
          </p>
        )}
        {isFairOpen ? (
          <Link href={LIVE_EVENTS} as={LIVE_EVENTS}>
            <a className="button is-primary">
              <Icon name="chevrons-right" /> Go to events
            </a>
          </Link>
        ) : (
          <p>
            The <b>{fairName}</b> opens <TimeAgo date={fair?.start_time} />.
          </p>
        )}
        <div className="columns mt-3">
          {events.map(
            ({ start_time, end_time, events }, i): ReactElement => {
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
