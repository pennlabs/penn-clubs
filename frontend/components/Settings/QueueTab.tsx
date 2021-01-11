import Link from 'next/link'
import { ReactElement, useEffect, useState } from 'react'
import styled from 'styled-components'

import { CLUB_ROUTE } from '../../constants'
import { Club } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import {
  OBJECT_NAME_PLURAL,
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from '../../utils/branding'
import { Icon } from '../common'

type QueueTableProps = {
  clubs: Club[] | null
}

const QueueTable = ({ clubs }: QueueTableProps): ReactElement => {
  if (clubs === null) {
    return <div className="has-text-info">Loading table...</div>
  }

  if (!clubs.length) {
    return (
      <div className="has-text-info">
        There are no {OBJECT_NAME_PLURAL} in this table.
      </div>
    )
  }

  return (
    <table className="table is-fullwidth">
      <thead>
        <tr>
          <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {clubs.map((club) => (
          <tr key={club.code}>
            <td>
              <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
                <a target="_blank">{club.name}</a>
              </Link>
            </td>
            <td>
              {club.active === false ? (
                <span className="has-text-danger">
                  <Icon name="x" /> Inactive
                </span>
              ) : (
                <>
                  {club.approved === null && (
                    <span className="has-text-info">
                      <Icon name="clock" /> Pending Approval
                    </span>
                  )}
                  {club.approved === false && (
                    <span className="has-text-danger">
                      <Icon name="x" /> Rejected
                    </span>
                  )}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const MultiProgressBar = styled.div`
  height: 1rem;
  border-radius: 2rem;
  display: block;
  overflow: hidden;
  width: 100%;
`

const ProgressBarSegment = styled.div<{ size: number }>`
  height: 1rem;
  width: ${({ size }) => Math.floor(size * 10000) / 100}%;
  float: left;
`

const SmallTitle = styled.div`
  font-weight: bold;
  font-size: 1.2em;

  &:not(:first-child) {
    margin-top: 2rem;
  }
`

const QueueTab = (): ReactElement => {
  const [pendingClubs, setPendingClubs] = useState<Club[] | null>(null)
  const [rejectedClubs, setRejectedClubs] = useState<Club[] | null>(null)
  const [inactiveClubs, setInactiveClubs] = useState<Club[] | null>(null)
  const [allClubs, setAllClubs] = useState<boolean[] | null>(null)
  const canApprove = apiCheckPermission('clubs.approve_club')

  useEffect(() => {
    if (canApprove) {
      doApiRequest('/clubs/?active=true&approved=none&format=json')
        .then((resp) => resp.json())
        .then(setPendingClubs)

      doApiRequest('/clubs/?active=true&approved=false&format=json')
        .then((resp) => resp.json())
        .then(setRejectedClubs)

      doApiRequest('/clubs/?active=false&format=json')
        .then((resp) => resp.json())
        .then(setInactiveClubs)

      doApiRequest('/clubs/directory/?format=json')
        .then((resp) => resp.json())
        .then((data) => setAllClubs(data.map((club) => club.approved)))
    }
  }, [])

  if (!canApprove) {
    return (
      <div>You do not have permissions to approve {OBJECT_NAME_PLURAL}.</div>
    )
  }

  const inactiveClubsCount = inactiveClubs?.length ?? 0
  const pendingClubsCount = pendingClubs?.length ?? 0
  const approvedClubsCount =
    allClubs?.filter((status) => status === true).length ?? 0
  const rejectedClubsCount = rejectedClubs?.length ?? 0
  const totalClubsCount =
    approvedClubsCount +
    rejectedClubsCount +
    inactiveClubsCount +
    pendingClubsCount

  return (
    <>
      <SmallTitle>Overview</SmallTitle>
      <div className="mb-3">
        From the progress bar below, you can see the current approval status of
        all {OBJECT_NAME_PLURAL} across {SITE_NAME}.
      </div>
      <MultiProgressBar className="has-background-light mb-3 is-clearfix">
        {totalClubsCount > 0 && (
          <>
            <ProgressBarSegment
              className="has-background-info"
              size={inactiveClubsCount / totalClubsCount}
            />
            <ProgressBarSegment
              className="has-background-warning"
              size={pendingClubsCount / totalClubsCount}
            />
            <ProgressBarSegment
              className="has-background-danger"
              size={rejectedClubsCount / totalClubsCount}
            />
            <ProgressBarSegment
              className="has-background-success"
              size={approvedClubsCount / totalClubsCount}
            />
          </>
        )}
      </MultiProgressBar>
      <ul>
        <li className="has-text-info">
          {inactiveClubsCount} Inactive {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-warning-dark">
          {pendingClubsCount} Pending {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-danger">
          {rejectedClubsCount} Rejected {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-success">
          {approvedClubsCount} Approved {OBJECT_NAME_TITLE}
        </li>
      </ul>
      <SmallTitle>Pending Clubs</SmallTitle>
      <div className="mb-3">
        As an administrator of {SITE_NAME}, you can approve and reject{' '}
        {OBJECT_NAME_SINGULAR} approval requests. The table below contains a
        list of {pendingClubsCount} {OBJECT_NAME_PLURAL} pending your approval.
        Click on the {OBJECT_NAME_SINGULAR} name to view the{' '}
        {OBJECT_NAME_SINGULAR}.
      </div>
      <QueueTable clubs={pendingClubs} />
      <SmallTitle>Rejected Clubs</SmallTitle>
      <div className="mt-3 mb-3">
        The table below shows a list of {rejectedClubsCount}{' '}
        {OBJECT_NAME_PLURAL} that have been marked as not approved.
      </div>
      <QueueTable clubs={rejectedClubs} />
      <SmallTitle>Inactive Clubs</SmallTitle>
      <div className="mt-3 mb-3">
        The table below shows a list of {inactiveClubsCount}{' '}
        {OBJECT_NAME_PLURAL} that have not finished the creation or renewal
        process.
      </div>
      <QueueTable clubs={inactiveClubs} />
    </>
  )
}

export default QueueTab
