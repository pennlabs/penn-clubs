import Link from 'next/link'
import { useRouter } from 'next/router'
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
import { ModalContent } from '../ClubPage/Actions'
import { Checkbox, Icon, Modal } from '../common'

type QueueTableModalProps = {
  show: boolean
  closeModal: () => void
  bulkAction: (comment: string) => void
  approve: boolean
}

const QueueTableModal = ({
  show,
  closeModal,
  bulkAction,
  approve,
}: QueueTableModalProps): ReactElement => {
  const [comment, setComment] = useState<string>('')
  return (
    <Modal show={show} closeModal={closeModal} marginBottom={false}>
      <ModalContent>
        <div className="mb-3">You may include a comment with this action.</div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="textarea my-2"
          placeholder="Enter bulk approval or rejection notes here! Your notes will be emailed to the requester when you approve or reject this request."
        ></textarea>
        <button
          className={`mb-2 button ${approve ? 'is-success' : 'is-danger'}`}
          onClick={() => {
            closeModal()
            bulkAction(comment)
          }}
        >
          <Icon name={approve ? 'check' : 'x'} />
          {` ${approve ? 'Approve' : 'Reject'} and Send Message`}
        </button>
      </ModalContent>
    </Modal>
  )
}

type QueueTableProps = {
  clubs: Club[] | null
  selectableClubs: boolean // selectectable clubs -> can approve
  showStatus: boolean
  title: string
  description: string
}

// TODO: implement mohamed's table component for "Other Clubs" and leave approval
// queue functionality strictly to the "Pending Clubs" table.
const QueueTable = ({
  clubs,
  title,
  description,
  selectableClubs,
  showStatus,
}: QueueTableProps): ReactElement => {
  const router = useRouter()
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [approve, setApprove] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const allClubsSelected = selectedCodes.length === (clubs || []).length

  const toggleCode = (code: string) => {
    if (selectedCodes.includes(code)) {
      selectedCodes.splice(selectedCodes.indexOf(code), 1)
    } else {
      selectedCodes.push(code)
    }
    setSelectedCodes([...selectedCodes])
  }

  const bulkAction = (comment: string) => {
    const codeSet = new Set(selectedCodes) // O(1) lookup for our filter
    setLoading(true)
    Promise.all(
      (clubs || [])
        .filter((club: Club) => club.active && codeSet.has(club.code))
        .map((club: Club) =>
          doApiRequest(`/clubs/${club.code}/?format=json`, {
            method: 'PATCH',
            body: {
              approved: approve,
              approved_comment:
                comment || '(Administrator did not include a comment.)',
            },
          }),
        ),
    ).then(() => {
      setLoading(false)
      router.reload()
    })
  }

  return (
    <>
      <QueueTableModal
        show={showModal}
        closeModal={() => setShowModal(false)}
        bulkAction={bulkAction}
        approve={approve}
      />
      <QueueTableHeader>
        <QueueTableHeaderText>
          <SmallTitle>{title}</SmallTitle>
          <div className="mt-3 mb-3">{description}</div>
        </QueueTableHeaderText>
        {selectableClubs && (
          <div className="buttons">
            <button
              className="button is-success"
              disabled={!(clubs || []).length || loading}
              onClick={() => {
                setApprove(true)
                setShowModal(true)
              }}
            >
              <Icon name="check" /> Approve
            </button>
            <button
              className="button is-danger"
              disabled={!(clubs || []).length || loading}
              onClick={() => {
                setApprove(false)
                setShowModal(true)
              }}
            >
              <Icon name="x" /> Reject
            </button>
          </div>
        )}
      </QueueTableHeader>
      {(() => {
        if (clubs === null)
          return <div className="has-text-info">Loading table...</div>
        if (!clubs.length)
          return (
            <div className="has-text-info">
              There are no {OBJECT_NAME_PLURAL} in this table.
            </div>
          )
        return (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                {selectableClubs && (
                  <th>
                    <Checkbox
                      checked={allClubsSelected}
                      onChange={() =>
                        setSelectedCodes(
                          allClubsSelected
                            ? []
                            : clubs.map((club) => club.code),
                        )
                      }
                    />
                  </th>
                )}
                <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                {showStatus && <th>Status</th>}
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.code}>
                  {selectableClubs && (
                    <td>
                      <Checkbox
                        checked={selectedCodes.includes(club.code)}
                        onChange={() => toggleCode(club.code)}
                      />
                    </td>
                  )}
                  <td>
                    <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(club.code)}>
                      <a target="_blank">{club.name}</a>
                    </Link>
                  </td>
                  {showStatus && (
                    <td>
                      {(() => {
                        if (!club.active)
                          return (
                            <span className="has-text-primary">
                              <Icon name="clock" /> Inactive
                            </span>
                          )
                        if (club.approved)
                          return (
                            <span className="has-text-success">
                              <Icon name="check" /> Approved
                            </span>
                          )
                        return (
                          <span className="has-text-danger">
                            <Icon name="x" /> Rejected
                          </span>
                        )
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )
      })()}
    </>
  )
}

const QueueTableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const QueueTableHeaderText = styled.div`
  flex-basis: 75%;
`

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
  const [approvedClubs, setApprovedClubs] = useState<Club[] | null>(null)
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

      doApiRequest('/clubs/?active=true&approved=true&format=json')
        .then((resp) => resp.json())
        .then(setApprovedClubs)

      doApiRequest('/clubs/directory/?format=json')
        .then((resp) => resp.json())
        .then((data) => setAllClubs(data.map((club: Club) => club.approved)))
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
      <QueueTable
        title={'Pending Clubs'}
        description={`As an administrator of ${SITE_NAME}, you can approve and reject
        ${OBJECT_NAME_SINGULAR} approval requests. The table below contains a
        list of ${pendingClubsCount} ${OBJECT_NAME_PLURAL} pending your approval.
        Click on the ${OBJECT_NAME_SINGULAR} name to view the ${OBJECT_NAME_SINGULAR}.`}
        clubs={pendingClubs}
        selectableClubs={true}
        showStatus={false}
      />
      <QueueTable
        title={'Other Clubs'}
        description={`The table below shows a list of ${OBJECT_NAME_PLURAL} that have been marked
        as approved, rejected or that are inactive.`}
        clubs={
          approvedClubs &&
          rejectedClubs &&
          inactiveClubs &&
          approvedClubs.concat(rejectedClubs, inactiveClubs)
        }
        selectableClubs={false}
        showStatus={true}
      />
    </>
  )
}

export default QueueTab
