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
  width: ${({ size }) => size * 100}%;
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
  const [clubs, setClubs] = useState<Club[] | null>(null)
  const [rejectedClubs, setRejectedClubs] = useState<Club[] | null>(null)
  const [allClubs, setAllClubs] = useState<boolean[] | null>(null)
  const canApprove = apiCheckPermission('clubs.approve_club')

  useEffect(() => {
    if (canApprove) {
      doApiRequest('/clubs/?active=true&approved=none&format=json')
        .then((resp) => resp.json())
        .then(setClubs)

      doApiRequest('/clubs/?active=true&approved=false&format=json')
        .then((resp) => resp.json())
        .then(setRejectedClubs)

      doApiRequest('/clubs/directory/?format=json')
        .then((resp) => resp.json())
        .then((data) => setAllClubs(data.map((club) => club.approved)))
    }
  }, [])

  if (!canApprove) {
    return <div>Nothing to see here!</div>
  }

  const inactiveClubs =
    (allClubs?.filter((status) => status === null).length ?? 0) -
    (clubs?.length ?? 0)
  const pendingClubs = clubs?.length ?? 0
  const approvedClubs =
    allClubs?.filter((status) => status === true).length ?? 0
  const totalClubs = allClubs?.length ?? 0

  return (
    <>
      <SmallTitle>Overview</SmallTitle>
      <div className="mb-3">
        From the progress bar below, you can see the current approval status of
        all {OBJECT_NAME_PLURAL} across {SITE_NAME}.
      </div>
      <MultiProgressBar className="has-background-light mb-3 is-clearfix">
        {totalClubs > 0 && (
          <>
            <ProgressBarSegment
              className="has-background-info"
              size={inactiveClubs / totalClubs}
            />
            <ProgressBarSegment
              className="has-background-warning"
              size={pendingClubs / totalClubs}
            />
            <ProgressBarSegment
              className="has-background-danger"
              size={(rejectedClubs?.length ?? 0) / totalClubs}
            />
            <ProgressBarSegment
              className="has-background-success"
              size={approvedClubs / totalClubs}
            />
          </>
        )}
      </MultiProgressBar>
      <ul>
        <li className="has-text-info">
          {inactiveClubs} Inactive {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-warning-dark">
          {pendingClubs} Pending {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-danger">
          {rejectedClubs?.length ?? 0} Rejected {OBJECT_NAME_TITLE}
        </li>
        <li className="has-text-success">
          {approvedClubs} Approved {OBJECT_NAME_TITLE}
        </li>
      </ul>
      <SmallTitle>Pending Clubs</SmallTitle>
      <div className="mb-3">
        As an administrator of {SITE_NAME}, you can approve and reject{' '}
        {OBJECT_NAME_SINGULAR} approval requests. The table below contains a
        list of {pendingClubs} {OBJECT_NAME_PLURAL} pending your approval. Click
        on the {OBJECT_NAME_SINGULAR} name to view the {OBJECT_NAME_SINGULAR}.
      </div>
      <QueueTable clubs={clubs} />
      <SmallTitle>Rejected Clubs</SmallTitle>
      <div className="mt-3 mb-3">
        The table below shows a list of {rejectedClubs?.length ?? 0}{' '}
        {OBJECT_NAME_PLURAL} that have been marked as not approved.
      </div>
      <QueueTable clubs={rejectedClubs} />
    </>
  )
}

export default QueueTab
