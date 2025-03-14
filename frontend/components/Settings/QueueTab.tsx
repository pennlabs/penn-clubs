import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { CLUB_ROUTE } from '../../constants'
import { Club, RegistrationQueueSettings, Template } from '../../types'
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
  templates: Template[]
}

const QueueTableModal = ({
  show,
  closeModal,
  bulkAction,
  isApproving,
  templates,
}: QueueTableModalProps): ReactElement<any> => {
  const [comment, setComment] = useState<string>('')
  const [selectedTemplates, setSelectedTemplates] = useState<Template[]>([])

  useEffect(() => {
    setComment(
      selectedTemplates.map((template) => template.content).join('\n\n'),
    )
  }, [selectedTemplates])

  return (
    <Modal
      show={show}
      closeModal={() => {
        setComment('')
        setSelectedTemplates([])
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
        <Select
          isMulti
          isClearable
          placeholder="Select templates"
          value={selectedTemplates.map((template) => ({
            value: template.id,
            label: template.title,
            content: template.content,
            author: template.author,
          }))}
          options={templates.map((template) => ({
            value: template.id,
            label: template.title,
            content: template.content,
            author: template.author,
          }))}
          onChange={(selectedOptions) => {
            if (selectedOptions) {
              const selected = selectedOptions.map((option) => ({
                id: option.value,
                title: option.label,
                content: option.content,
                author: option.author,
              }))
              setSelectedTemplates(selected)
            } else {
              setSelectedTemplates([])
            }
          }}
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="textarea my-2"
          placeholder={`${isApproving ? 'approval' : 'rejection'} notes`}
        ></textarea>
        <button
          className={`mt-2 button ${isApproving ? 'is-success' : 'is-danger'}`}
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
  templates: Template[]
}
/* TODO: refactor with Table component when render and search
functionality are disconnected */
const QueueTable = ({
  clubs,
  templates,
}: QueueTableProps): ReactElement<any> => {
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
        templates={templates}
      />
      <QueueSectionHeader>
        <div>
          <SmallTitle>Pending Clubs</SmallTitle>
          <div className="mt-3 mb-3">
            As an administrator of {SITE_NAME}, you can approve and reject{' '}
            {OBJECT_NAME_SINGULAR} approval requests. The table below contains a
            list of {OBJECT_NAME_PLURAL} pending your approval. Click on the{' '}
            {OBJECT_NAME_SINGULAR} name to view the {OBJECT_NAME_SINGULAR}.
          </div>
        </div>
        <QueueSettingsButtonStack direction="row">
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
        </QueueSettingsButtonStack>
      </QueueSectionHeader>
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
                  <td>
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
                    <ClubLink {...club} />
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

const ClubLink = ({ code, name }: Club) => (
  <Link href={CLUB_ROUTE()} as={CLUB_ROUTE(code)} target="_blank">
    {name}
  </Link>
)
const QueueSectionHeader = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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

const QueueSettingsButtonStack = styled.div<{ direction: 'column' | 'row' }>`
  display: flex;
  flex-direction: ${({ direction }) => direction};
  align-items: flex-end;
  flex-shrink: 0;
  gap: 0.5rem;
`

const QueueSettingsButton = ({
  open,
  for: queueType,
  setOpen: setQueueOpen,
}: {
  open: boolean
  for: 'reapproval_queue_open' | 'new_approval_queue_open'
  setOpen: (open: boolean) => void
}): ReactElement<any> => {
  const onClick = () => {
    doApiRequest('/settings/queue/', {
      method: 'PATCH',
      body: {
        [queueType]: !open,
      },
    }).then((resp) => {
      if (resp.ok) {
        setQueueOpen(!open)
      } else {
        toast.error('Failed to update queue settings.')
      }
    })
  }
  const name =
    queueType === 'reapproval_queue_open' ? 'Reapprovals' : 'New Approvals'
  if (open) {
    return (
      <button className="button is-small is-danger is-block" onClick={onClick}>
        Close {name}
      </button>
    )
  } else {
    return (
      <button className="button is-small is-success is-block" onClick={onClick}>
        Open {name}
      </button>
    )
  }
}

const QueueTab = (): ReactElement<any> => {
  const [pendingClubs, setPendingClubs] = useState<Club[] | null>(null)
  const [approvedClubs, setApprovedClubs] = useState<Club[] | null>(null)
  const [rejectedClubs, setRejectedClubs] = useState<Club[] | null>(null)
  const [inactiveClubs, setInactiveClubs] = useState<Club[] | null>(null)
  const [allClubs, setAllClubs] = useState<boolean[] | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [registrationQueueSettings, setRegistrationQueueSettings] =
    useState<RegistrationQueueSettings | null>(null)
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

      doApiRequest('/templates/?format=json')
        .then((resp) => resp.json())
        .then(setTemplates)

      doApiRequest('/settings/queue/?format=json')
        .then((resp) => resp.json())
        .then(setRegistrationQueueSettings)
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
      <QueueSectionHeader>
        <div>
          <SmallTitle>Overview</SmallTitle>
          <div className="mb-3">
            From the progress bar below, you can see the current approval status
            of all {OBJECT_NAME_PLURAL} across {SITE_NAME}.{' '}
          </div>
        </div>
      </QueueSectionHeader>
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
      {registrationQueueSettings && (
        <>
          <QueueSectionHeader>
            <div>
              <SmallTitle>Status</SmallTitle>
              <div className="mb-3">
                The approval queue is currently
                <b
                  className={
                    registrationQueueSettings.reapproval_queue_open
                      ? 'has-text-success'
                      : 'has-text-danger'
                  }
                >
                  {registrationQueueSettings.reapproval_queue_open
                    ? ' open'
                    : ' closed'}
                </b>{' '}
                for reapproval requests and
                <b
                  className={
                    registrationQueueSettings.new_approval_queue_open
                      ? 'has-text-success'
                      : 'has-text-danger'
                  }
                >
                  {registrationQueueSettings.new_approval_queue_open
                    ? ' open'
                    : ' closed'}
                </b>{' '}
                for new requests.
                <span
                  title={`Queue settings last updated at ${new Date(registrationQueueSettings.updated_at).toLocaleString()} by ${registrationQueueSettings.updated_by}`}
                >
                  <Icon name="clock" className="ml-1" />
                </span>
              </div>
            </div>
          </QueueSectionHeader>
          <QueueSettingsButtonStack direction="row">
            <QueueSettingsButton
              open={registrationQueueSettings.reapproval_queue_open}
              for="reapproval_queue_open"
              setOpen={(open) =>
                setRegistrationQueueSettings({
                  ...registrationQueueSettings,
                  reapproval_queue_open: open,
                })
              }
            />
            <QueueSettingsButton
              open={registrationQueueSettings.new_approval_queue_open}
              for="new_approval_queue_open"
              setOpen={(open) =>
                setRegistrationQueueSettings({
                  ...registrationQueueSettings,
                  new_approval_queue_open: open,
                })
              }
            />
          </QueueSettingsButtonStack>
        </>
      )}
      <QueueTable clubs={pendingClubs} templates={templates} />
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
