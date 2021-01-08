import { NextPageContext } from 'next'
import Link from 'next/link'
import { ReactElement, useState } from 'react'
import TimeAgo from 'react-timeago'

import { CLUB_APPLICATIONS } from '../../../components/ClubEditPage/ClubEditCard'
import ClubMetadata from '../../../components/ClubMetadata'
import { RequestMembershipButton } from '../../../components/ClubPage/Actions'
import {
  Container,
  Icon,
  Subtitle,
  Text,
  Title,
} from '../../../components/common'
import { CLUB_ROUTE } from '../../../constants'
import renderPage from '../../../renderPage'
import { Club, ClubApplication, ClubApplicationRequired } from '../../../types'
import { doApiRequest, getSemesterFromDate } from '../../../utils'
import { logEvent } from '../../../utils/analytics'
import {
  OBJECT_NAME_SINGULAR,
  SITE_ID,
  SITE_NAME,
} from '../../../utils/branding'

type Props = {
  club: Club
  applications: ClubApplication[]
}

const ApplyPage = ({ club, applications }: Props): ReactElement => {
  const [updatedIsRequest, setUpdatedIsRequest] = useState<boolean>(
    club.is_request,
  )

  const isOpenMembership =
    club.application_required === ClubApplicationRequired.Open

  const btn = (
    <RequestMembershipButton
      club={{ ...club, is_request: updatedIsRequest }}
      updateRequests={async (code: string) => {
        logEvent('request', code)
        if (updatedIsRequest) {
          await doApiRequest(`/requests/${club.code}/?format=json`, {
            method: 'DELETE',
          })
        } else {
          await doApiRequest(`/requests/?format=json`, {
            method: 'POST',
            body: { club: code },
          })
        }
        setUpdatedIsRequest((upd) => !upd)
      }}
    />
  )

  return (
    <>
      <ClubMetadata club={club} />
      <Container paddingTop>
        <div className="is-clearfix">
          <Title className="is-pulled-left">{club.name} Application</Title>
          <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
            <a className="button is-pulled-right is-secondary is-medium">
              Back
            </a>
          </Link>
        </div>
        <hr />
        {isOpenMembership ? (
          <>
            <Subtitle>Open Membership</Subtitle>
            <Text>
              This {OBJECT_NAME_SINGULAR} has open membership and no application
              is required to join the {OBJECT_NAME_SINGULAR}. You can request to
              be added as a member to this {OBJECT_NAME_SINGULAR} on {SITE_NAME}
              . The {OBJECT_NAME_SINGULAR} is currently{' '}
              {club.accepting_members ? 'accepting' : 'not accepting'} new
              members.
            </Text>
          </>
        ) : (
          <>
            <Subtitle>
              {
                CLUB_APPLICATIONS.find(
                  (app) => app.value === club.application_required,
                )?.label
              }
            </Subtitle>
            <Text>
              {club.name} requires an application process to join the{' '}
              {OBJECT_NAME_SINGULAR}. You can subscribe to this{' '}
              {OBJECT_NAME_SINGULAR} to get notified when applications open and
              close.
            </Text>
          </>
        )}
        <Text>
          {club.how_to_get_involved.length > 0
            ? club.how_to_get_involved
            : `This ${OBJECT_NAME_SINGULAR} has no additional details on how to get involved.`}
        </Text>
        {isOpenMembership ? (
          btn
        ) : (
          <>
            {applications.length <= 0 && (
              <div className="notification is-info">
                <Icon name="alert-circle" /> There are no applications available
                for <b>{club.name}</b> at the moment. This{' '}
                {OBJECT_NAME_SINGULAR} may not be recruiting at the moment or
                have not entered their application information into {SITE_NAME}.
              </div>
            )}
            {applications.map((app) => (
              <div className="box" key={app.id}>
                <Subtitle>
                  {app.name}{' '}
                  <span className="has-text-grey">
                    for {getSemesterFromDate(app.application_end_time)}
                  </span>
                </Subtitle>
                <div>
                  <b>Open Time:</b>{' '}
                  {new Date(app.application_start_time).toLocaleString()} (
                  <TimeAgo date={app.application_start_time} />)
                </div>
                <div>
                  <b>Close Time:</b>{' '}
                  {new Date(app.application_end_time).toLocaleString()} (
                  <TimeAgo date={app.application_end_time} />)
                </div>
                <div>
                  <b>Results Released By:</b>{' '}
                  {new Date(app.result_release_time).toLocaleString()} (
                  <TimeAgo date={app.result_release_time} />)
                </div>
                <a
                  href={app.external_url}
                  rel="noopener noreferrer"
                  className="button is-success mt-3"
                >
                  <Icon name="edit" /> Apply
                </a>
              </div>
            ))}
            <Subtitle>Already a member?</Subtitle>
            <Text>
              Are you an existing member of {club.name}, but not on {SITE_ID}{' '}
              yet? Use the button below to request to be added to this{' '}
              {OBJECT_NAME_SINGULAR} on {SITE_NAME}.
            </Text>
            {btn}
          </>
        )}
      </Container>
    </>
  )
}

ApplyPage.getInitialProps = async ({ query, req }: NextPageContext) => {
  const data = {
    headers: req ? { cookie: req.headers.cookie } : undefined,
  }
  const [clubReq, appReq] = await Promise.all([
    doApiRequest(`/clubs/${query.club}/?format=json`, data),
    doApiRequest(`/clubs/${query.club}/applications/?format=json`, data),
  ])
  const clubRes = await clubReq.json()
  const appRes = await appReq.json()

  return { club: clubRes, applications: appRes }
}

export default renderPage(ApplyPage)
