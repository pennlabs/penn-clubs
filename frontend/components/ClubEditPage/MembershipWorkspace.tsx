import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import Select from 'react-select'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { ApplicationSubmission, Club, MembershipRank } from '../../types'
import {
  doApiRequest,
  formatResponse,
  getApiUrl,
  getRoleDisplay,
} from '../../utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_MEMBERSHIP_DEFAULT_TITLE,
  OBJECT_NAME_SINGULAR,
  SCHOOL_NAME,
  SHOW_APPLICATIONS,
  SHOW_MEMBERSHIP_REQUEST,
} from '../../utils/branding'
import { Icon, Modal } from '../common'
import Table from '../common/Table'
import {
  selectComponents,
  selectMenuPortalTarget,
  selectMenuStyles,
} from '../common/selectStyles'
import {
  AdminActions,
  AdminGhost,
  AdminPrimary,
  SlidingPills,
} from './adminControls'
import {
  ADMIN_ACCENT,
  ADMIN_CANVAS,
  ADMIN_FONT,
  ADMIN_NAVY,
  ADMIN_PAD_FIELD,
} from './adminTheme'
import { PageTitle } from './ClubAdminShell'
import { MEMBERSHIP_ROLES } from './MembersCard'

type Member = {
  username: string
  name: string
  email: string
  title: string
  role: number
  active: boolean
  description?: string
  graduation_year?: number | null
  major?: { name: string }[]
  created_at?: string
}

type Invite = {
  id: number
  email: string
  title: string
  role: number
  updated_at: string
}

type RequestRow = {
  username: string
  name: string
  email: string
  graduation_year?: number | null
  major?: { name: string }[]
  school?: { name: string }[]
  created_at?: string
}

type Recipient = {
  id: string
  label: string
  email?: string
  kind: 'member' | 'invite' | 'request' | 'email' | 'submission'
}

type MessageType = 'invite' | 'application' | 'general'

type Draft = {
  id: string
  type: MessageType
  subject: string
  body: string
  tags: string
  recipientIds: string[]
}

function messageTypeLabel(type: MessageType) {
  if (type === 'application') {
    return 'Application'
  }
  if (type === 'general') {
    return 'General'
  }
  return 'Invite'
}

type ColumnKey =
  | 'name'
  | 'year'
  | 'date'
  | 'major'
  | 'subteam'
  | 'bio'
  | 'email'
  | 'role'

const DEFAULT_COLUMNS: ColumnKey[] = [
  'name',
  'email',
  'role',
  'subteam',
  'year',
  'date',
  'major',
  'bio',
]

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name: 'Name',
  year: 'Year',
  date: 'Date joined',
  major: 'Major',
  subteam: 'Subteam',
  bio: 'Bio',
  email: 'Email',
  role: 'Role',
}

const Fill = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
  gap: 16px;
  align-items: stretch;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    overflow: hidden;
  }
`

const Column = styled.section`
  background: ${ADMIN_CANVAS};
  border: 0;
  border-radius: 10px;
  padding: 18px 16px 16px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ColumnHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  margin: 0 0 12px;
`

const HeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

const BackButton = styled.button`
  appearance: none;
  align-items: center;
  background: white;
  border: 0;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  cursor: pointer;
  display: inline-flex;
  flex-shrink: 0;
  height: 32px;
  justify-content: center;
  padding: 0;
  width: 32px;

  svg {
    display: block;
    stroke-width: 2.75;
  }
`

const Widget = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px 14px 14px;
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const ListToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  margin: 0 0 12px;
`

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 999px;
  color: ${ADMIN_NAVY};
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  box-sizing: border-box;
  height: 38px;
  padding: 0 16px;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:focus {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
    text-decoration: none;
  }
`

const Check = styled.input.attrs({ type: 'checkbox' })`
  width: 15px;
  height: 15px;
  margin: 0;
  accent-color: #4954f4;
  cursor: pointer;
  vertical-align: middle;
`

const Menu = styled.div`
  position: relative;
`

const Popover = styled.div`
  position: absolute;
  z-index: 5;
  top: calc(100% + 6px);
  right: 0;
  background: white;
  border: 1px solid #e4e4e4;
  border-radius: 10px;
  padding: 10px;
  min-width: 180px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
`

const ActionRow = styled.div`
  display: flex;
  gap: 6px;
`

const Tiny = styled.button`
  border: 0;
  background: #f3f3f3;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  color: ${ADMIN_NAVY};
  font-size: 12px;
`

const Composer = styled(Widget)`
  overflow: auto;
  color: ${ADMIN_NAVY};
  font-size: ${ADMIN_FONT};

  input,
  textarea,
  label,
  button,
  p,
  span {
    font-family: inherit;
    font-size: inherit;
  }

  > label:first-of-type {
    margin-top: 0;
  }
`

const InputLabel = styled.label`
  display: block;
  font-size: ${ADMIN_FONT};
  font-weight: 400;
  color: ${ADMIN_NAVY};
  margin: ${ADMIN_PAD_FIELD} 0 4px;
`

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: #f3f3f3;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 8px 10px;
  color: ${ADMIN_NAVY};
  font-family: inherit;
  font-size: ${ADMIN_FONT};
`

const Area = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 160px;
  background: #f3f3f3;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 8px 10px;
  color: ${ADMIN_NAVY};
  font-family: inherit;
  font-size: ${ADMIN_FONT};
  resize: vertical;

  &::placeholder {
    color: #9aa0a6;
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  background: #f3f3f3;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 6px 10px;
  min-height: 40px;
`

const ChipPlaceholder = styled.span`
  color: #9aa0a6;
  font-size: ${ADMIN_FONT};
`

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: white;
  border: 1px solid ${ADMIN_ACCENT};
  color: ${ADMIN_ACCENT};
  border-radius: 999px;
  padding: 2px 8px;
  font-size: ${ADMIN_FONT};
`

const SendRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: ${ADMIN_PAD_FIELD};
`

const SendSplit = styled.div`
  display: inline-flex;
  align-items: stretch;
  background: ${ADMIN_ACCENT};
  border-radius: 8px;
  overflow: hidden;
`

const SendMain = styled.button`
  appearance: none;
  align-items: center;
  background: transparent;
  border: 0;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-size: ${ADMIN_FONT};
  font-weight: 600;
  gap: 8px;
  line-height: 1;
  padding: 9px 14px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  svg {
    color: #fff;
    display: block;
  }
`

const SendCaret = styled.button`
  appearance: none;
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  padding: 0 10px;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  svg {
    color: #fff;
    display: block;
  }
`

const SendButton = styled.button`
  background: ${ADMIN_ACCENT};
  color: white;
  border: 0;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const GhostButton = styled.button`
  background: white;
  border: 1px solid #d8d8d8;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  color: ${ADMIN_NAVY};
  font-family: inherit;
  font-size: ${ADMIN_FONT};
`

const Hint = styled.p`
  color: #42424f;
  font-size: ${ADMIN_FONT};
  margin: 8px 0 0;
`

const draftKey = (code: string) => `penn-clubs-message-drafts:${code}`

function loadDrafts(code: string): Draft[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.sessionStorage.getItem(draftKey(code))
    return raw ? (JSON.parse(raw) as Draft[]) : []
  } catch {
    return []
  }
}

function saveDrafts(code: string, drafts: Draft[]) {
  window.sessionStorage.setItem(draftKey(code), JSON.stringify(drafts))
}

function majorText(major?: { name: string }[]) {
  return (
    major
      ?.map((item) => item.name)
      .filter(Boolean)
      .join(', ') || ''
  )
}

function dateText(value?: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString()
}

function SelectAllCheckbox({
  rows,
  recipients,
  onToggle,
}: {
  rows: { recipient: Recipient }[]
  recipients: Recipient[]
  onToggle: (next: Recipient[]) => void
}): ReactElement<any> {
  const ref = useRef<HTMLInputElement>(null)
  const selected = new Set(recipients.map((item) => item.id))
  const count = rows.filter((row) => selected.has(row.recipient.id)).length
  const all = rows.length > 0 && count === rows.length
  const some = count > 0 && !all

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = some
    }
  }, [some])

  return (
    <Check
      ref={ref}
      checked={all}
      aria-label="Select all members"
      onChange={() => {
        if (all) {
          const ids = new Set(rows.map((row) => row.recipient.id))
          onToggle(recipients.filter((item) => !ids.has(item.id)))
          return
        }
        const have = new Set(recipients.map((item) => item.id))
        const add = rows
          .filter((row) => !have.has(row.recipient.id))
          .map((row) => row.recipient)
        onToggle([...recipients, ...add])
      }}
    />
  )
}

export default function MembershipWorkspace({
  club,
}: {
  club: Club
}): ReactElement<any> {
  const [segment, setSegment] = useState<'active' | 'pending' | 'requests'>(
    'active',
  )
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [messageType, setMessageType] = useState<MessageType>('invite')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [inviteEmails, setInviteEmails] = useState('')
  const [inviteTitle, setInviteTitle] = useState(
    OBJECT_MEMBERSHIP_DEFAULT_TITLE,
  )
  const [inviteRole, setInviteRole] = useState(
    () =>
      MEMBERSHIP_ROLES.find(({ value }) => value in MEMBERSHIP_ROLE_NAMES) ??
      MEMBERSHIP_ROLES[0],
  )
  const [sending, setSending] = useState(false)
  const [sendMenu, setSendMenu] = useState(false)
  const [draftsOpen, setDraftsOpen] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [applications, setApplications] = useState<
    {
      id: number
      name: string
      acceptance_email?: string
      rejection_email?: string
    }[]
  >([])
  const [applicationId, setApplicationId] = useState<number | ''>('')
  const [emailKind, setEmailKind] = useState<'acceptance' | 'rejection'>(
    'acceptance',
  )
  const [submissions, setSubmissions] = useState<ApplicationSubmission[]>([])
  const [editing, setEditing] = useState<Member | null>(null)

  const reloadMembers = () => {
    doApiRequest(`/clubs/${club.code}/members/?format=json`)
      .then((resp) => resp.json())
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]))
  }

  const reloadInvites = () => {
    doApiRequest(`/clubs/${club.code}/invites/?format=json`)
      .then((resp) => resp.json())
      .then((data) => setInvites(Array.isArray(data) ? data : []))
      .catch(() => setInvites([]))
  }

  const reloadRequests = () => {
    if (!SHOW_MEMBERSHIP_REQUEST) {
      return
    }
    doApiRequest(`/clubs/${club.code}/membershiprequests/?format=json`)
      .then((resp) => resp.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
  }

  useEffect(() => {
    reloadMembers()
    reloadInvites()
    reloadRequests()
    setDrafts(loadDrafts(club.code))
    if (SHOW_APPLICATIONS) {
      doApiRequest(`/clubs/${club.code}/applications/?format=json`)
        .then((resp) => resp.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : []
          setApplications(list)
          if (list[0]) {
            setApplicationId(list[0].id)
          }
        })
        .catch(() => setApplications([]))
    }
  }, [club.code])

  useEffect(() => {
    if (!applicationId || messageType !== 'application') {
      return
    }
    const app = applications.find((item) => item.id === applicationId)
    if (app) {
      setBody(
        emailKind === 'acceptance'
          ? app.acceptance_email || ''
          : app.rejection_email || '',
      )
    }
    doApiRequest(
      `/clubs/${club.code}/applications/${applicationId}/submissions/?format=json`,
    )
      .then((resp) => resp.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
  }, [applicationId, emailKind, messageType, club.code, applications.length])

  const toggleRecipient = (recipient: Recipient) => {
    setRecipients((current) => {
      const exists = current.some((item) => item.id === recipient.id)
      return exists
        ? current.filter((item) => item.id !== recipient.id)
        : [...current, recipient]
    })
  }

  const rows = useMemo(() => {
    if (segment === 'pending') {
      return invites.map((invite) => ({
          id: `invite-${invite.id}`,
          recipient: {
            id: `invite-${invite.id}`,
            label: invite.email,
            email: invite.email,
            kind: 'invite' as const,
          },
          cells: {
            name: invite.email,
            year: '',
            date: dateText(invite.updated_at),
            major: '',
            subteam: invite.title,
            bio: '',
            email: invite.email,
            role: getRoleDisplay(invite.role as MembershipRank),
          },
          actions: (
            <ActionRow>
              <Tiny
                type="button"
                onClick={() => {
                  doApiRequest(
                    `/clubs/${club.code}/invites/${invite.id}/resend/?format=json`,
                    { method: 'PUT' },
                  )
                    .then((resp) => resp.json())
                    .then((data) => toast.info(data.detail || 'Invite resent'))
                }}
              >
                Resend
              </Tiny>
              <Tiny
                type="button"
                onClick={() => {
                  doApiRequest(
                    `/clubs/${club.code}/invites/${invite.id}/?format=json`,
                    { method: 'DELETE' },
                  ).then(() => {
                    toast.success('Invitation has been removed!')
                    reloadInvites()
                  })
                }}
              >
                Remove
              </Tiny>
            </ActionRow>
          ),
        }))
    }

    if (segment === 'requests') {
      return requests.map((request) => ({
          id: `request-${request.username}`,
          recipient: {
            id: `request-${request.username}`,
            label: request.name || request.username,
            email: request.email,
            kind: 'request' as const,
          },
          cells: {
            name: request.name || request.username,
            year: request.graduation_year
              ? String(request.graduation_year)
              : '',
            date: dateText(request.created_at),
            major: majorText(request.major),
            subteam: '',
            bio: '',
            email: request.email,
            role: 'Request',
          },
          actions: (
            <ActionRow>
              <Tiny
                type="button"
                className="button is-primary is-small"
                onClick={() => {
                  doApiRequest(
                    `/clubs/${club.code}/membershiprequests/${request.username}/accept/?format=json`,
                    { method: 'POST' },
                  ).then(() => {
                    toast.success('Request accepted')
                    reloadRequests()
                    reloadMembers()
                  })
                }}
              >
                Accept
              </Tiny>
              <Tiny
                type="button"
                onClick={() => {
                  doApiRequest(
                    `/clubs/${club.code}/membershiprequests/${request.username}/?format=json`,
                    { method: 'DELETE' },
                  ).then(() => {
                    toast.success('Request removed')
                    reloadRequests()
                  })
                }}
              >
                Delete
              </Tiny>
            </ActionRow>
          ),
        }))
    }

    return members.map((member) => ({
        id: `member-${member.username}`,
        recipient: {
          id: `member-${member.username}`,
          label: member.name || member.username,
          email: member.email,
          kind: 'member' as const,
        },
        cells: {
          name: member.name || member.username,
          year: member.graduation_year ? String(member.graduation_year) : '',
          date: dateText(member.created_at),
          major: majorText(member.major),
          subteam: member.title,
          bio: member.description || '',
          email: member.email,
          role: getRoleDisplay(member.role as MembershipRank),
        },
        actions: (
          <ActionRow>
            <Tiny type="button" onClick={() => setEditing(member)}>
              Edit
            </Tiny>
            <Tiny
              type="button"
              onClick={() => {
                if (
                  !window.confirm(
                    `Kick ${member.name || member.username} from this ${OBJECT_NAME_SINGULAR}?`,
                  )
                ) {
                  return
                }
                doApiRequest(
                  `/clubs/${club.code}/members/${member.username}/?format=json`,
                  { method: 'DELETE' },
                ).then((resp) => {
                  if (resp.ok) {
                    toast.success('Member removed')
                    reloadMembers()
                  } else {
                    resp.json().then((err) => toast.error(formatResponse(err)))
                  }
                })
              }}
            >
              Kick
            </Tiny>
          </ActionRow>
        ),
      }))
  }, [segment, members, invites, requests, club.code])

  const tableData = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        recipient: row.recipient,
        roleValue:
          segment === 'active'
            ? members.find((member) => `member-${member.username}` === row.id)
                ?.role
            : undefined,
        ...row.cells,
        actions: row.actions,
      })),
    [rows, segment, members],
  )

  const tableColumns = useMemo(() => {
    const keys: ColumnKey[] =
      segment === 'active'
        ? DEFAULT_COLUMNS
        : segment === 'pending'
          ? ['email', 'subteam', 'role', 'date']
          : ['name', 'year', 'date', 'major', 'email']
    return [
      {
        name: 'select',
        label: 'Select',
        header: (
          <SelectAllCheckbox
            rows={rows}
            recipients={recipients}
            onToggle={setRecipients}
          />
        ),
        render: (id: string) => {
          const row = rows.find((item) => item.id === id)
          if (row == null) {
            return null
          }
          const selected = recipients.some(
            (item) => item.id === row.recipient.id,
          )
          return (
            <Check
              aria-label={`Select ${row.cells.name || row.cells.email}`}
              checked={selected}
              onChange={() => toggleRecipient(row.recipient)}
            />
          )
        },
      },
      ...keys.map((key) => ({
        name: key,
        label:
          key === 'date' && segment === 'pending'
            ? 'Sent'
            : key === 'subteam' && segment === 'pending'
              ? 'Title'
              : COLUMN_LABELS[key],
      })),
      {
        name: 'Actions',
        render: (id: string) => rows.find((item) => item.id === id)?.actions,
      },
    ]
  }, [segment, rows, recipients])

  const roleFilterOptions = useMemo(
    () =>
      segment === 'active'
        ? [
            {
              label: 'role',
              options: [
                { key: '0', label: 'Owner' },
                { key: '10', label: 'Officer' },
                { key: '20', label: 'Member' },
              ],
              filterFunction: (selection, row) =>
                row.roleValue === Number(selection),
            },
          ]
        : undefined,
    [segment],
  )

  const activeEmails = new Set(
    members.map((member) => (member.email || '').toLowerCase()).filter(Boolean),
  )

  const typedEmails = inviteEmails
    .split(/(?:\n|\||,)/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0)

  const inviteTargets = Array.from(
    new Set(
      [
        ...recipients
          .filter((item) => item.kind !== 'member' && item.email)
          .map((item) => item.email as string),
        ...typedEmails,
      ].map((email) => email.trim()),
    ),
  ).filter((email) => email && !activeEmails.has(email.toLowerCase()))

  const submissionRecipients = recipients.filter(
    (item) => item.kind === 'submission',
  )

  const generalEmails = Array.from(
    new Set(
      recipients
        .map((item) => item.email)
        .filter((email): email is string => Boolean(email && email.trim())),
    ),
  )

  const sendDisabled =
    sending ||
    (messageType === 'invite'
      ? inviteTargets.length === 0
      : messageType === 'general'
        ? generalEmails.length === 0 || !body.trim()
        : !applicationId || submissionRecipients.length === 0)

  const sendHint =
    messageType === 'invite'
      ? inviteTargets.length === 0
        ? 'Active members cannot be emailed from here. Add an email address to invite someone new, or select a pending invite.'
        : `Invite uses ${SCHOOL_NAME} accounts when possible. People who are already members are skipped.`
      : messageType === 'general'
        ? generalEmails.length === 0
          ? 'Select members in the table to email, then write a subject and body.'
          : 'Sends this message to the selected club members.'
        : submissionRecipients.length === 0
          ? 'Application emails go to applicants, not active members. Choose applicants below. Send uses the existing status-and-reason email flow.'
          : 'Send notifies applicants who already have this status and a reason, the same as the applications page.'

  const sendInvites = async () => {
    setSending(true)
    const chunks: string[][] = []
    for (let i = 0; i < inviteTargets.length; i += 10) {
      chunks.push(inviteTargets.slice(i, i + 10))
    }
    let sent = 0
    let skipped = 0
    try {
      for (const chunk of chunks) {
        const resp = await doApiRequest(
          `/clubs/${club.code}/invite/?format=json`,
          {
            method: 'POST',
            body: {
              emails: chunk.join('\n'),
              role: inviteRole.value,
              title: inviteTitle,
            },
          },
        )
        const data = await resp.json()
        if (!data.success) {
          toast.error(formatResponse(data))
          return
        }
        sent += data.sent || 0
        skipped += data.skipped || 0
      }
      toast.success(
        `Sent invites to ${sent} emails! ${skipped} emails were skipped because they are already invited or a member.`,
      )
      setInviteEmails('')
      reloadInvites()
    } finally {
      setSending(false)
    }
  }

  const sendApplication = async (dryRun: boolean, allowResend: boolean) => {
    if (!applicationId) {
      return
    }
    setSending(true)
    const field =
      emailKind === 'acceptance' ? 'acceptance_email' : 'rejection_email'
    try {
      const saved = await doApiRequest(
        `/clubs/${club.code}/applications/${applicationId}/?format=json`,
        {
          method: 'PATCH',
          body: { [field]: body },
        },
      )
      if (!saved.ok) {
        toast.error(formatResponse(await saved.json()))
        return
      }
      const resp = await doApiRequest(
        `/clubs/${club.code}/applications/${applicationId}/send_emails/?format=json`,
        {
          method: 'POST',
          body: {
            dry_run: dryRun,
            allow_resend: allowResend,
            email_type: {
              id: emailKind,
              name: emailKind === 'acceptance' ? 'Acceptance' : 'Rejection',
            },
          },
        },
      )
      const payload = await resp.json()
      toast[resp.ok ? 'success' : 'error'](
        payload.detail || (dryRun ? 'Dry run finished' : 'Emails sent'),
      )
    } finally {
      setSending(false)
      setSendMenu(false)
    }
  }

  const sendGeneral = async () => {
    setSending(true)
    try {
      const resp = await doApiRequest(
        `/clubs/${club.code}/send_message/?format=json`,
        {
          method: 'POST',
          body: {
            subject,
            content: body,
            tags,
            emails: generalEmails,
          },
        },
      )
      const payload = await resp.json()
      toast[resp.ok ? 'success' : 'error'](
        payload.detail || (resp.ok ? 'Message sent' : 'Could not send message'),
      )
    } finally {
      setSending(false)
    }
  }

  const saveDraft = () => {
    const draft: Draft = {
      id: `${Date.now()}`,
      type: messageType,
      subject,
      body,
      tags,
      recipientIds: recipients.map((item) => item.id),
    }
    const next = [draft, ...drafts].slice(0, 20)
    setDrafts(next)
    saveDrafts(club.code, next)
    toast.success('Draft saved in this browser tab')
  }

  return (
    <Fill>
      <Layout>
        <Column>
          <ColumnHead>
            <PageTitle>Members</PageTitle>
          </ColumnHead>
          <ListToolbar>
            <SlidingPills
              value={segment}
              muted
              height={38}
              ariaLabel="Member list"
              onChange={setSegment}
              options={[
                { value: 'active' as const, label: 'Active' },
                { value: 'pending' as const, label: 'Pending' },
                ...(SHOW_MEMBERSHIP_REQUEST
                  ? [{ value: 'requests' as const, label: 'Requests' }]
                  : []),
              ]}
            />
            <DownloadButton
              href={getApiUrl(`/clubs/${club.code}/members/?format=xlsx`)}
            >
              <Icon name="download" alt="" size="1rem" fitSize />
              Download member list
            </DownloadButton>
          </ListToolbar>
          <Widget>
            <Table
              key={segment}
              variant="sheet"
              fillParent
              resizable
              initialPageSize={50}
              data={tableData}
              columns={tableColumns}
              searchableColumns={[
                'name',
                'email',
                'subteam',
                'bio',
                'major',
                'year',
                'role',
              ]}
              filterOptions={roleFilterOptions}
              isRowSelected={(row) =>
                recipients.some((item) => item.id === row.recipient?.id)
              }
            />
          </Widget>
        </Column>
        <Column>
          <ColumnHead>
            <HeadLeft>
              {!draftsOpen && (
                <BackButton
                  type="button"
                  aria-label="View drafts"
                  onClick={() => setDraftsOpen(true)}
                >
                  <Icon name="chevron-left" alt="" size="1.1rem" fitSize />
                </BackButton>
              )}
              <PageTitle>{draftsOpen ? 'Drafts' : 'Send Message'}</PageTitle>
            </HeadLeft>
            {draftsOpen && (
              <AdminPrimary type="button" onClick={() => setDraftsOpen(false)}>
                New message
              </AdminPrimary>
            )}
          </ColumnHead>
          {draftsOpen ? (
            <Widget>
              <Table
                variant="sheet"
                fillParent
                resizable
                focusable
                initialPageSize={50}
                data={drafts.map((draft) => ({
                  id: draft.id,
                  name:
                    draft.subject ||
                    (draft.type === 'application'
                      ? 'Application email'
                      : draft.type === 'general'
                        ? 'General email'
                        : 'Invite'),
                  type: messageTypeLabel(draft.type),
                  tags: draft.tags || '',
                  draft,
                }))}
                columns={[
                  { name: 'name', label: 'Subject' },
                  { name: 'type', label: 'Type' },
                  { name: 'tags', label: 'Tags' },
                ]}
                searchableColumns={['name', 'type', 'tags']}
                onClick={(row) => {
                  const draft = row.original?.draft as Draft
                  if (!draft) {
                    return
                  }
                  setMessageType(draft.type)
                  setSubject(draft.subject)
                  setBody(draft.body)
                  setTags(draft.tags)
                  setDraftsOpen(false)
                }}
              />
            </Widget>
          ) : (
          <Composer>
          <InputLabel htmlFor="message-type">Type</InputLabel>
          <Select
            inputId="message-type"
            aria-label="Message type"
            styles={selectMenuStyles}
            components={selectComponents}
            menuPortalTarget={selectMenuPortalTarget}
            menuPosition="fixed"
            isSearchable={false}
            options={[
              { value: 'general' as const, label: 'General' },
              { value: 'invite' as const, label: 'Invite' },
              ...(SHOW_APPLICATIONS
                ? [{ value: 'application' as const, label: 'Application' }]
                : []),
            ]}
            value={{
              value: messageType,
              label: messageTypeLabel(messageType),
            }}
            onChange={(option) => {
              if (option) {
                setMessageType(option.value)
              }
            }}
          />
          {messageType === 'general' ? (
            <>
              <InputLabel>Recipients</InputLabel>
              <Chips>
                {recipients.length === 0 ? (
                  <ChipPlaceholder>
                    Selected members will appear here.
                  </ChipPlaceholder>
                ) : (
                  recipients.map((recipient) => (
                    <Chip key={recipient.id}>
                      {recipient.label}
                      <button
                        type="button"
                        aria-label={`Remove ${recipient.label}`}
                        onClick={() =>
                          setRecipients((current) =>
                            current.filter((item) => item.id !== recipient.id),
                          )
                        }
                        style={{
                          border: 0,
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </Chip>
                  ))
                )}
              </Chips>
              <InputLabel htmlFor="message-subject">Subject</InputLabel>
              <TextInput
                id="message-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
              />
              <InputLabel htmlFor="message-tags">Tags</InputLabel>
              <TextInput
                id="message-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Optional tags"
              />
              <InputLabel htmlFor="message-body">Email body</InputLabel>
              <Area
                id="message-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write your message"
              />
            </>
          ) : messageType === 'invite' ? (
            <>
              <InputLabel>Recipients</InputLabel>
              <Chips>
                {recipients.length === 0 ? (
                  <ChipPlaceholder>
                    Selected members will appear here.
                  </ChipPlaceholder>
                ) : (
                  recipients.map((recipient) => (
                    <Chip key={recipient.id}>
                      {recipient.label}
                      <button
                        type="button"
                        aria-label={`Remove ${recipient.label}`}
                        onClick={() =>
                          setRecipients((current) =>
                            current.filter((item) => item.id !== recipient.id),
                          )
                        }
                        style={{
                          border: 0,
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </Chip>
                  ))
                )}
              </Chips>
              <InputLabel htmlFor="invite-emails">Emails</InputLabel>
              <Area
                id="invite-emails"
                placeholder="Enter email addresses separated by commas or newlines. Invites are not sent to people who are already members."
                data-testid="invite-emails-input"
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
              />
              <InputLabel>Permissions</InputLabel>
              <Select
                aria-label="Invite permissions"
                styles={selectMenuStyles}
                components={selectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                isSearchable={false}
                options={MEMBERSHIP_ROLES.filter(
                  ({ value }) => value in MEMBERSHIP_ROLE_NAMES,
                )}
                value={inviteRole}
                onChange={(option) => {
                  if (!option) {
                    return
                  }
                  setInviteRole(option)
                  if (
                    MEMBERSHIP_ROLES.map((role) => role.label).includes(
                      inviteTitle,
                    )
                  ) {
                    setInviteTitle(option.label)
                  }
                }}
              />
              <InputLabel htmlFor="invite-title">Title</InputLabel>
              <TextInput
                id="invite-title"
                value={inviteTitle}
                onChange={(event) => setInviteTitle(event.target.value)}
              />
            </>
          ) : (
            <>
              <InputLabel htmlFor="application-id">Application</InputLabel>
              <Select
                inputId="application-id"
                aria-label="Application"
                styles={selectMenuStyles}
                components={selectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                isSearchable={false}
                options={applications.map((app) => ({
                  value: app.id,
                  label: app.name,
                }))}
                value={
                  applications
                    .map((app) => ({ value: app.id, label: app.name }))
                    .find((option) => option.value === applicationId) || null
                }
                onChange={(option) => {
                  if (option) {
                    setApplicationId(option.value)
                  }
                }}
              />
              <InputLabel htmlFor="email-kind">Email</InputLabel>
              <Select
                inputId="email-kind"
                aria-label="Email kind"
                styles={selectMenuStyles}
                components={selectComponents}
                menuPortalTarget={selectMenuPortalTarget}
                menuPosition="fixed"
                isSearchable={false}
                options={[
                  { value: 'acceptance' as const, label: 'Acceptance' },
                  { value: 'rejection' as const, label: 'Rejection' },
                ]}
                value={{
                  value: emailKind,
                  label:
                    emailKind === 'acceptance' ? 'Acceptance' : 'Rejection',
                }}
                onChange={(option) => {
                  if (option) {
                    setEmailKind(option.value)
                  }
                }}
              />
              <InputLabel>Applicants</InputLabel>
              <div style={{ maxHeight: 140, overflow: 'auto' }}>
                {submissions.map((submission) => {
                  const id = `submission-${submission.pk}`
                  const label =
                    `${submission.first_name || ''} ${submission.last_name || ''}`.trim() ||
                    submission.email
                  const selected = recipients.some((item) => item.id === id)
                  return (
                    <label key={id} style={{ display: 'block' }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleRecipient({
                            id,
                            label,
                            email: submission.email,
                            kind: 'submission',
                          })
                        }
                      />{' '}
                      {label}
                    </label>
                  )
                })}
              </div>
              <InputLabel htmlFor="message-body">Email body</InputLabel>
              <Area
                id="message-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </>
          )}
          <SendRow>
            <Menu>
              {messageType === 'invite' || messageType === 'general' ? (
                <SendMain
                  type="button"
                  disabled={sendDisabled}
                  data-testid="invite-emails-submit"
                  onClick={() =>
                    messageType === 'general' ? sendGeneral() : sendInvites()
                  }
                  style={{
                    background: ADMIN_ACCENT,
                    borderRadius: 8,
                  }}
                >
                  <Icon name="send" alt="" size="1rem" fitSize noMargin />
                  Send
                </SendMain>
              ) : (
                <SendSplit>
                  <SendMain
                    type="button"
                    disabled={sendDisabled}
                    onClick={() => sendApplication(false, false)}
                  >
                    <Icon name="send" alt="" size="1rem" fitSize noMargin />
                    Send
                  </SendMain>
                  <SendCaret
                    type="button"
                    aria-label="More send options"
                    onClick={() => setSendMenu((open) => !open)}
                  >
                    <Icon
                      name="chevron-down"
                      alt=""
                      size="0.85rem"
                      fitSize
                      noMargin
                    />
                  </SendCaret>
                </SendSplit>
              )}
              {sendMenu && messageType === 'application' && (
                <Popover>
                  <button
                    type="button"
                    onClick={() => sendApplication(true, false)}
                  >
                    Dry run
                  </button>
                  <button
                    type="button"
                    onClick={() => sendApplication(false, true)}
                  >
                    Resend emails
                  </button>
                </Popover>
              )}
            </Menu>
            <GhostButton type="button" onClick={saveDraft}>
              Save Draft
            </GhostButton>
          </SendRow>
          <Hint>{sendHint}</Hint>
          </Composer>
          )}
        </Column>
      </Layout>
      {editing && (
        <Modal show closeModal={() => setEditing(null)} width="480px">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              doApiRequest(
                `/clubs/${club.code}/members/${editing.username}/?format=json`,
                {
                  method: 'PATCH',
                  body: {
                    title: editing.title,
                    role: editing.role,
                    active: editing.active,
                  },
                },
              ).then(async (resp) => {
                if (resp.ok) {
                  toast.success('Member updated')
                  setEditing(null)
                  reloadMembers()
                } else {
                  toast.error(formatResponse(await resp.json()))
                }
              })
            }}
          >
            <h2>Edit {editing.name}</h2>
            <InputLabel htmlFor="member-title">Title</InputLabel>
            <TextInput
              id="member-title"
              value={editing.title}
              onChange={(event) =>
                setEditing({ ...editing, title: event.target.value })
              }
            />
            <InputLabel htmlFor="member-role">Type</InputLabel>
            <Select
              inputId="member-role"
              styles={selectMenuStyles}
              components={selectComponents}
              menuPortalTarget={selectMenuPortalTarget}
              menuPosition="fixed"
              isSearchable={false}
              getOptionLabel={(role) => role.label}
              getOptionValue={(role) => String(role.value)}
              value={
                MEMBERSHIP_ROLES.find((role) => role.value === editing.role) ??
                null
              }
              options={MEMBERSHIP_ROLES.filter(
                ({ value }) => value in MEMBERSHIP_ROLE_NAMES,
              )}
              onChange={(option) => {
                if (option) {
                  setEditing({ ...editing, role: option.value })
                }
              }}
            />
            <label style={{ display: 'block', margin: '12px 0' }}>
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(event) =>
                  setEditing({ ...editing, active: event.target.checked })
                }
              />{' '}
              Active member
            </label>
            <AdminActions>
              <AdminGhost type="button" onClick={() => setEditing(null)}>
                Cancel
              </AdminGhost>
              <AdminPrimary type="submit">Save member</AdminPrimary>
            </AdminActions>
          </form>
        </Modal>
      )}
    </Fill>
  )
}
