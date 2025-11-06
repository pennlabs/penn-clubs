import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
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
  SHOW_OWNERSHIP_REQUESTS,
  SITE_NAME,
} from '../../utils/branding'
import { ModalContent } from '../ClubPage/Actions'
import { Checkbox, Icon, Modal } from '../common'

type ClubDiff = {
  description: {
    old: string
    new: string
    diff: string
  }
  name: {
    old: string
    new: string
  }
  image: {
    old: string
    new: string
  }
}

type QueueTableModalProps = {
  show: boolean
  closeModal: () => void
  bulkAction: (comment: string) => void
  isApproving: boolean
  templates: Template[]
}

type OwnershipRequest = {
  id: number
  club: string
  club_name: string
  name: string
  username: string
  created_at: string
}

const QueueTableModal = ({
  show,
  closeModal,
  bulkAction,
  isApproving,
  templates,
}: QueueTableModalProps): ReactElement => {
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
  refetchClubs?: () => void
  templates: Template[]
}
/* TODO: refactor with Table component when render and search
functionality are disconnected */
const QueueTable = ({
  clubs,
  refetchClubs,
  templates,
}: QueueTableProps): ReactElement => {
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
    ).then(() => {
      setLoading(false)
      setSelectedCodes([])
      setShowModal(false)
      if (refetchClubs) refetchClubs()
    })
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
        <QueueSectionHeaderText>
          <SmallTitle>Pending Clubs</SmallTitle>
          <div className="mt-3 mb-3">
            As an administrator of {SITE_NAME}, you can approve and reject{' '}
            {OBJECT_NAME_SINGULAR} approval requests. The table below contains a
            list of {OBJECT_NAME_PLURAL} pending your approval. Click on the{' '}
            {OBJECT_NAME_SINGULAR} name to view the {OBJECT_NAME_SINGULAR}.
          </div>
        </QueueSectionHeaderText>
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

const ClubLink = ({ code, name }: Club) => (
  <Link
    href={CLUB_ROUTE()}
    as={CLUB_ROUTE(code)}
    target="_blank"
    style={{ marginRight: '1rem' }}
  >
    {name}
  </Link>
)

const ClubTags = ({ code, name }: Club): ReactElement => {
  const tagList: string[][] = []

  const [diffs, setDiffs] = useState<ClubDiff | null>(null)

  const retrieveDiffs = async () => {
    const resp = await doApiRequest(
      `/clubs/${code}/club_detail_diff/?format=json`,
      {
        method: 'GET',
      },
    )
    const json = await resp.json()
    return json[code]
  }

  useEffect(() => {
    const fetchDiffs = async () => {
      const resp = await retrieveDiffs()
      if (
        resp === 'No changes that require approval made since last approval'
      ) {
        setDiffs(null)
      } else {
        setDiffs(resp)
      }
    }
    fetchDiffs()
  }, [code])

  if (diffs !== null) {
    const oldDescription: string = diffs.description.old ?? ''
    const newDescription: string = diffs.description.new ?? ''
    const oldTitle: string = diffs.name.old
    const newTitle: string = diffs.name.new ?? ''
    const oldImage: string = diffs.image.old ?? ''
    const newImage: string = diffs.image.new ?? ''

    if (oldTitle == null) {
      tagList.push(['New Club', '#8467c2'])
    } else {
      if (oldTitle.valueOf() !== newTitle.valueOf()) {
        tagList.push(['Title', '#4198db'])
      }
      if (oldDescription.valueOf() !== newDescription.valueOf()) {
        tagList.push(['Mission', '#ee4768'])
      }
      if (oldImage !== newImage) {
        tagList.push(['Image', '#4cc776'])
      }
    }
  }

  return (
    <>
      {tagList.map(([text, color]) => {
        return <TableTag style={{ backgroundColor: color }}>{text}</TableTag>
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

const QueueSectionHeader = styled.div`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const QueueRowContent = styled.div`
  display: flex;
`

const QueueSectionHeaderText = styled.div`
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

const ModalDatePickerWrapper = styled.div`
  .react-datepicker-popper {
    z-index: 2003 !important;
  }

  .react-datepicker-wrapper {
    width: 100%;
  }

  display: flex;
  margin-bottom: 3rem;
  overflow: visible;
`

type QueueSchedulerModalProps = {
  show: boolean
  queueType: 'reapproval' | 'new'
  registrationQueueSettings?: RegistrationQueueSettings | null
  setRegistrationQueueSettings: (settings: RegistrationQueueSettings) => void
  showModal: boolean
  closeModal: () => void
}

function parseDate(value?: string | null): Date | null {
  return value ? new Date(value) : null
}

const QueueSchedulerModal = ({
  show,
  queueType,
  registrationQueueSettings,
  showModal,
  setRegistrationQueueSettings,
  closeModal,
}: QueueSchedulerModalProps): ReactElement => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  useEffect(() => {
    if (!registrationQueueSettings) return

    const date =
      queueType === 'reapproval'
        ? parseDate(registrationQueueSettings?.reapproval_date_of_next_flip)
        : parseDate(registrationQueueSettings?.new_approval_date_of_next_flip)

    setSelectedDate(date)
  }, [showModal])

  const queueState =
    queueType === 'reapproval'
      ? registrationQueueSettings?.reapproval_queue_open
      : registrationQueueSettings?.new_approval_queue_open || false
  const desiredState = !queueState // if queue is open, we want to close it, and vice versa
  const scheduledDate =
    queueType === 'reapproval'
      ? registrationQueueSettings?.reapproval_date_of_next_flip
      : registrationQueueSettings?.new_approval_date_of_next_flip

  const saveScheduledDate = async () => {
    const body: Record<string, any> = {}
    if (queueType === 'reapproval') {
      body.reapproval_date_of_next_flip = selectedDate
        ? selectedDate.toISOString()
        : null
    } else {
      body.new_approval_date_of_next_flip = selectedDate
        ? selectedDate.toISOString()
        : null
    }
    try {
      const resp = await doApiRequest('/settings/queue/', {
        method: 'PATCH',
        body,
      })

      if (!resp.ok) {
        toast.error('Failed to update queue settings.')
        return
      }

      const refreshedSettings = await resp.json()
      setRegistrationQueueSettings(refreshedSettings)
      toast.success('Successfully updated queue settings.')
    } catch (err) {}
    // setApprove(true)
    // setShowModal(true)
    closeModal()
  }

  const now = new Date()
  const maxTime = new Date().setHours(23, 59)

  return (
    <Modal
      show={show}
      closeModal={() => {
        closeModal()
      }}
      overflow="visible"
    >
      <ModalContent>
        <div className="mb3" style={{ marginBottom: '2rem' }}>
          The{' '}
          <b>
            {queueType === 'reapproval' ? 'reapproval' : 'new request approval'}{' '}
            queue
          </b>{' '}
          is currently
          <b className={queueState ? 'has-text-success' : 'has-text-danger'}>
            {' '}
            {queueState ? ' open' : ' closed'}
          </b>{' '}
          and is currently{' '}
          {scheduledDate == null ? (
            <>
              not scheduled to
              <b
                className={
                  desiredState ? 'has-text-success' : 'has-text-danger'
                }
              >
                {desiredState ? ' open. ' : ' close. '}
              </b>
            </>
          ) : (
            <>
              {' '}
              scheduled to{' '}
              <b
                className={
                  desiredState ? 'has-text-success' : 'has-text-danger'
                }
              >
                {desiredState ? ' open ' : ' close '}
              </b>
              at{' '}
              <b>
                {new Date(scheduledDate).toLocaleString(undefined, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </b>
              .
            </>
          )}{' '}
          Schedule when the{' '}
          <b>
            {queueType === 'reapproval'
              ? 'reapproval '
              : 'new request approval'}{' '}
            queue
          </b>{' '}
          should{' '}
          <b className={desiredState ? 'has-text-success' : 'has-text-danger'}>
            {desiredState ? 'open' : 'close'}
          </b>
          !
        </div>
        <label>Date and Time</label>
        <ModalDatePickerWrapper>
          <DatePicker
            selected={selectedDate}
            // onCalendarOpen={() => {setSelectedDate(new Date)}}
            onChange={(date: Date) => {
              if (date <= now) {
                const nextHour = new Date(now)
                nextHour.setHours(now.getHours() + 1, 0, 0, 0)
                date = nextHour
              }
              setSelectedDate(date)
            }}
            onChangeRaw={(e) => {
              e.preventDefault() // Currently prevents manual text input. If implement, add checking for valid times
              // const dateStr = e.target.value.trim()
            }}
            showTimeSelect
            dateFormat="MM/dd/yyyy h:mm aa"
            timeIntervals={60}
            minDate={now}
            minTime={
              !selectedDate ||
              (selectedDate && selectedDate.toDateString()) ===
                now.toDateString()
                ? now
                : new Date().setHours(0, 0)
            }
            maxTime={maxTime}
            placeholderText="Select date and time"
            className="input"
            // portalId="root-portal"
          />
          <button
            type="button"
            className="button is-right"
            title="Clear Date"
            onClick={() => setSelectedDate(null)}
          >
            <Icon name="x" className="has-text-dark" size="20" />
          </button>
        </ModalDatePickerWrapper>

        <div className="buttons">
          <button
            className="button is-success"
            // disabled={!selectedCodes.length || loading}
            onClick={saveScheduledDate}
          >
            <Icon name="check" /> Confirm
          </button>
          <button
            className="button is-danger"
            // disabled={!selectedCodes.length || loading}
            onClick={() => {
              closeModal()
            }}
          >
            <Icon name="x" /> Cancel
          </button>
        </div>
      </ModalContent>
    </Modal>
  )
}

const QueueTab = (): ReactElement => {
  const [ownershipRequests, setOwnershipRequests] = useState<
    OwnershipRequest[]
  >([])
  const [pendingClubs, setPendingClubs] = useState<Club[] | null>(null)
  const [approvedClubs, setApprovedClubs] = useState<Club[] | null>(null)
  const [rejectedClubs, setRejectedClubs] = useState<Club[] | null>(null)
  const [inactiveClubs, setInactiveClubs] = useState<Club[] | null>(null)
  const [allClubs, setAllClubs] = useState<boolean[] | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [registrationQueueSettings, setRegistrationQueueSettings] =
    useState<RegistrationQueueSettings | null>(null)
  const canApprove = apiCheckPermission('clubs.approve_club')
  const [showQSModal, setShowQSModal] = useState<boolean>(false)
  const [QSModalQueueType, setQSModalQueueType] = useState<
    'reapproval' | 'new'
  >('reapproval')

  function refetchClubs() {
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
      .then((data) => {
        setRegistrationQueueSettings(data)
      })
  }

  useEffect(() => {
    if (canApprove) {
      refetchClubs()

      doApiRequest('/clubs/any/ownershiprequests/all/?format=json')
        .then((resp) => resp.json())
        .then(setOwnershipRequests)
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

  const handleOwnershipDecision = async (
    clubCode: string,
    username: string,
    approve: boolean,
  ) => {
    const url = approve
      ? `/clubs/${clubCode}/ownershiprequests/${username}/accept/?format=json`
      : `/clubs/${clubCode}/ownershiprequests/${username}/?format=json`

    const method = approve ? 'POST' : 'DELETE'

    try {
      const res = await doApiRequest(url, { method })

      if (res.ok) {
        toast.success(
          `Successfully ${approve ? 'approved' : 'rejected'} request.`,
        )
        setOwnershipRequests((prev) =>
          prev.filter((r) => !(r.club === clubCode && r.username === username)),
        )
      } else {
        const err = await res.json()
        toast.error(`Failed: ${err.detail || 'Unknown error'}`)
      }
    } catch (err) {
      toast.error('An error occurred while processing the request.')
    }
  }

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
            <div
              className="reapproval-datepicker-icon"
              style={{ justifySelf: 'center', alignSelf: 'center' }}
            >
              <span title="Schedule reapproval queue open/close time">
                <Icon
                  name="calendar"
                  size="20"
                  onClick={() => {
                    setShowQSModal(true)
                    setQSModalQueueType('reapproval')
                  }}
                />
              </span>
            </div>

            <QueueSchedulerModal
              show={showQSModal}
              queueType={QSModalQueueType}
              registrationQueueSettings={registrationQueueSettings}
              showModal={showQSModal}
              setRegistrationQueueSettings={setRegistrationQueueSettings}
              closeModal={() => {
                setShowQSModal(false)
              }}
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
            <div
              className="new-approval-datepicker-icon"
              style={{ justifySelf: 'center', alignSelf: 'center' }}
            >
              <span title="Schedule new approval queue open/close time">
                <Icon
                  name="calendar"
                  size="20"
                  onClick={() => {
                    setShowQSModal(true)
                    setQSModalQueueType('new')
                  }}
                />
              </span>
            </div>
          </QueueSettingsButtonStack>
        </>
      )}
      <QueueTable
        clubs={pendingClubs}
        refetchClubs={refetchClubs}
        templates={templates}
      />
      {SHOW_OWNERSHIP_REQUESTS && (
        <>
          <SmallTitle>Pending Ownership Requests</SmallTitle>
          <div className="mt-3 mb-3">
            These are user-submitted requests to take ownership of inactive
            clubs. You can approve or reject each request individually.
          </div>

          {ownershipRequests.length === 0 ? (
            <div className="has-text-info">
              There are no ownership requests at this time.
            </div>
          ) : (
            <table className="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Requester</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ownershipRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <Link href={`/club/${req.club}`} target="_blank">
                        {req.club_name}
                      </Link>
                    </td>
                    <td>{req.name || 'Unknown User'}</td>
                    <td>
                      {req.created_at
                        ? new Date(req.created_at).toLocaleDateString()
                        : 'Invalid Date'}
                    </td>
                    <td>
                      <button
                        className="button is-small is-success mr-2"
                        onClick={() =>
                          handleOwnershipDecision(req.club, req.username, true)
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="button is-small is-danger"
                        onClick={() =>
                          handleOwnershipDecision(req.club, req.username, false)
                        }
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
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
