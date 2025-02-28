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
  isApproving: boolean
}

const QueueTableModal = ({
  show,
  closeModal,
  bulkAction,
  isApproving,
}: QueueTableModalProps): ReactElement => {
  const [comment, setComment] = useState<string>('')
  return (
    <Modal
      show={show}
      closeModal={() => {
        setComment('')
        closeModal()
      }}
      marginBottom={false}
    >
      <ModalContent>
        <div className="mb-3">
          Enter bulk {isApproving ? 'approval' : 'rejection'} notes here! Your
          notes will be emailed to the requesters when you{' '}
          {isApproving ? 'approve' : 'reject'} these requests.
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="textarea my-2"
          placeholder={`${isApproving ? 'approval' : 'rejection'} notes`}
        ></textarea>
        <button
          className={`mb-2 button ${isApproving ? 'is-success' : 'is-danger'}`}
          onClick={() => {
            closeModal()
            bulkAction(comment)
          }}
        >
          <Icon name={isApproving ? 'check' : 'x'} />
          {isApproving ? 'Approve' : 'Reject'} and Send Message
        </button>
      </ModalContent>
    </Modal>
  )
}

type QueueTableProps = {
  clubs: Club[] | null
}
/* TODO: refactor with Table component when render and search
functionality are disconnected */
const QueueTable = ({ clubs }: QueueTableProps): ReactElement => {
  const router = useRouter()
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [approve, setApprove] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const allClubsSelected = selectedCodes.length === (clubs || []).length

  const bulkAction = (comment: string) => {
    setLoading(true)
    Promise.all(
      (clubs || [])
        .filter(
          (club: Club) => club.active && selectedCodes.includes(club.code),
        )
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
    ).then(router.reload)
  }

  return (
    <>
      <QueueTableModal
        show={showModal}
        closeModal={() => setShowModal(false)}
        bulkAction={bulkAction}
        isApproving={approve}
      />
      <QueueTableHeader>
        <QueueTableHeaderText>
          <SmallTitle>Pending Clubs</SmallTitle>
          <div className="mt-3 mb-3">
            As an administrator of {SITE_NAME}, you can approve and reject{' '}
            {OBJECT_NAME_SINGULAR} approval requests. The table below contains a
            list of {OBJECT_NAME_PLURAL} pending your approval. Click on the{' '}
            {OBJECT_NAME_SINGULAR} name to view the {OBJECT_NAME_SINGULAR}.
          </div>
        </QueueTableHeaderText>
        <div className="buttons">
          <button
            className="button is-success"
            disabled={!selectedCodes.length || loading}
            onClick={() => {
              setApprove(true)
              setShowModal(true)
            }}
          >
            <Icon name="check" /> Approve
          </button>
          <button
            className="button is-danger"
            disabled={!selectedCodes.length || loading}
            onClick={() => {
              setApprove(false)
              setShowModal(true)
            }}
          >
            <Icon name="x" /> Reject
          </button>
        </div>
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
                <th>
                  <Checkbox
                    className="mr-3"
                    checked={allClubsSelected}
                    onChange={() =>
                      setSelectedCodes(
                        allClubsSelected ? [] : clubs.map(({ code }) => code),
                      )
                    }
                  />
                  {OBJECT_NAME_TITLE_SINGULAR}
                </th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.code}>
                  <TableRow>
                    <Checkbox
                      className="mr-3"
                      checked={selectedCodes.includes(club.code)}
                      onChange={() =>
                        setSelectedCodes(
                          selectedCodes.includes(club.code)
                            ? selectedCodes.filter((c) => c !== club.code)
                            : [...selectedCodes, club.code],
                        )
                      }
                    />
                    <QueueRowContent>
                      <ClubLink {...club} />
                      <ClubTags {...club} />
                    </QueueRowContent>
                  </TableRow>
                </tr>
              ))}
            </tbody>
          </table>
        )
      })()}
    </>
  )
}

const retrieveDiffs = async (club) => {
  const resp = await doApiRequest(`/clubs/${club.code}/club_detail_diff/?format=json`, {
    method: 'GET'
  })
  const json = await resp.json()
  return json[club.code]
}

const ClubLink = ({ code, name }: Club) => (
  <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)} target="_blank" style={{marginRight: "1rem"}}>
    {name}
  </Link>
)

const ClubTags = ({ code, name }: Club) : ReactElement => {
  
  const tagList : string[][] = []
  const diffs = retrieveDiffs({ code, name})

  const oldDescription : String = diffs["description"]["old"]
  const newDescription : String = diffs["description"]["new"]
  const oldTitle : String = diffs["description"]["old"]
  const newTitle : String = diffs["description"]["new"]
  const oldImage : String = diffs["image"]["old"]
  const newImage : String = diffs["image"]["new"]

  if (oldTitle == null || code == "broke") {
    tagList.push(["New Club", "#8467c2"])
  } 
  else {
    if (oldTitle != newTitle){     
      tagList.push(["Title", "#4198db"])
    }
    if (oldDescription != newDescription){
      tagList.push(["Desc", "#ee4768"])
    }
    if (oldImage != newImage){
      tagList.push(["Image", "#4cc776"])
    }
  }
  
  return (
    <>
      {tagList.map(([text, color]) => {
        return (
          <TableTag style={{backgroundColor: color}}>
            {text}
          </TableTag>
        )
      })}
    </>
  )
}


const TableRow = styled.td`
  display: flex;  
`

const TableTag = styled.div`
  height: 1.3125rem;
  margin-top: 0.0625rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 0.65625rem;
  color: white;
  font-size: 0.875rem;
`

const QueueTableHeader = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const QueueRowContent = styled.div`
  display: flex;
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

  if (!canApprove)
    return (
      <div>You do not have permissions to approve {OBJECT_NAME_PLURAL}.</div>
    )

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
  const otherClubs =
    approvedClubs &&
    rejectedClubs &&
    inactiveClubs &&
    approvedClubs.concat(rejectedClubs, inactiveClubs)
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
      <QueueTable clubs={pendingClubs} />
      <SmallTitle>Other Clubs</SmallTitle>
      <div className="mt-3 mb-3">
        The table below shows a list of {OBJECT_NAME_PLURAL} that have been
        marked as approved, rejected or that are inactive.
      </div>
      {/* TODO: refactor with Table component when render and search
      functionality are disconnected */}
      {(() => {
        if (otherClubs === null)
          return <div className="has-text-info">Loading table...</div>
        if (!otherClubs.length)
          return (
            <div className="has-text-info">
              There are no {OBJECT_NAME_PLURAL} in this table.
            </div>
          )
        return (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>{OBJECT_NAME_TITLE_SINGULAR}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {otherClubs.map((club) => (
                <tr key={club.code}>
                  <td>
                    <ClubLink {...club} />
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )
      })()}
    </>
  )
}

export default QueueTab
