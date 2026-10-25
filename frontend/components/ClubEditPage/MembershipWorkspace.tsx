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
import { ADMIN_ACCENT, ADMIN_CANVAS, ADMIN_NAVY } from './adminTheme'
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

type Draft = {
  id: string
  type: 'invite' | 'application'
  subject: string
  body: string
  tags: string
  recipientIds: string[]
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

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.8fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`

const Column = styled.section`
  background: ${ADMIN_CANVAS};
  border: 0;
  border-radius: 10px;
  padding: 18px 16px 16px;
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const ColumnHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
`

const Widget = styled.div`
  background: white;
  border-radius: 10px;
  padding: 12px 14px 14px;
  min-width: 0;
`

const ListToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 12px;
`

const Segment = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: white;
  border-radius: 999px;
  padding: 4px;
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
  padding: 8px 14px;
  text-decoration: none;
  white-space: nowrap;

  &:hover,
  &:focus {
    background: #f7f8fb;
    color: ${ADMIN_NAVY};
    text-decoration: none;
  }
`

const SegmentButton = styled.button<{ $active?: boolean }>`
  border: 0;
  background: ${({ $active }) => ($active ? '#e7f6ee' : 'transparent')};
  color: ${({ $active }) => ($active ? '#178a4a' : '#6b7280')};
  border-radius: 999px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 14px;
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
  flex: 1;

  > label:first-of-type {
    margin-top: 0;
  }
`

const InputLabel = styled.label`
  display: block;
  font-size: 13px;
  color: ${ADMIN_NAVY};
  margin: 10px 0 4px;
`

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: #f3f3f3;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 8px 10px;
  color: ${ADMIN_NAVY};
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
  resize: vertical;
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  background: #f3f3f3;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  padding: 6px;
  min-height: 40px;
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
  font-size: 13px;
`

const RecipientButton = styled.button<{ $on?: boolean }>`
  margin-left: auto;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid ${({ $on }) => ($on ? ADMIN_ACCENT : '#d8d8d8')};
  background: ${({ $on }) => ($on ? '#eef0ff' : 'white')};
  color: ${ADMIN_ACCENT};
  cursor: pointer;
`

const SendRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
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
`

const Hint = styled.p`
  color: #42424f;
  font-size: 12px;
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
  const [picking, setPicking] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [messageType, setMessageType] = useState<'invite' | 'application'>(
    'invite',
  )
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

  const sendDisabled =
    sending ||
    (messageType === 'invite'
      ? inviteTargets.length === 0
      : !applicationId || submissionRecipients.length === 0)

  const sendHint =
    messageType === 'invite'
      ? inviteTargets.length === 0
        ? 'Active members cannot be emailed from here. Add an email address to invite someone new, or select a pending invite.'
        : `Invite uses ${SCHOOL_NAME} accounts when possible. People who are already members are skipped.`
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
    <>
      <Layout>
        <Column>
          <ColumnHead>
            <PageTitle>Members</PageTitle>
          </ColumnHead>
          <ListToolbar>
            <Segment>
              <SegmentButton
                type="button"
                $active={segment === 'active'}
                onClick={() => setSegment('active')}
              >
                Active
              </SegmentButton>
              <SegmentButton
                type="button"
                $active={segment === 'pending'}
                onClick={() => setSegment('pending')}
              >
                Pending
              </SegmentButton>
              {SHOW_MEMBERSHIP_REQUEST && (
                <SegmentButton
                  type="button"
                  $active={segment === 'requests'}
                  onClick={() => setSegment('requests')}
                >
                  Requests
                </SegmentButton>
              )}
            </Segment>
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
            <PageTitle>Send Message</PageTitle>
            <Menu>
              <GhostButton
                type="button"
                onClick={() => setDraftsOpen((open) => !open)}
              >
                <Icon name="file" alt="" /> Drafts
              </GhostButton>
              {draftsOpen && (
                <Popover>
                  {drafts.length === 0 && <div>No drafts yet.</div>}
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      onClick={() => {
                        setMessageType(draft.type)
                        setSubject(draft.subject)
                        setBody(draft.body)
                        setTags(draft.tags)
                        setDraftsOpen(false)
                      }}
                    >
                      {draft.subject || draft.type}
                    </button>
                  ))}
                </Popover>
              )}
            </Menu>
          </ColumnHead>
          <Composer>
          <InputLabel htmlFor="message-type">Type</InputLabel>
          <select
            id="message-type"
            aria-label="Message type"
            value={messageType}
            onChange={(event) =>
              setMessageType(event.target.value as 'invite' | 'application')
            }
            style={{ width: '100%' }}
          >
            {SHOW_APPLICATIONS && (
              <option value="application">Application</option>
            )}
            <option value="invite">Invite</option>
          </select>
          <InputLabel>Recipients</InputLabel>
          <Chips>
            {recipients.map((recipient) => (
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
            ))}
            <RecipientButton
              type="button"
              $on={picking}
              aria-label="Add recipients from the table"
              title="Add recipients from the table"
              onClick={() => setPicking((on) => !on)}
            >
              <Icon name="plus" alt="" size="0.8rem" />
            </RecipientButton>
          </Chips>
          <InputLabel htmlFor="message-subject">Subject</InputLabel>
          <TextInput
            id="message-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <InputLabel htmlFor="message-tags">Tags</InputLabel>
          <TextInput
            id="message-tags"
            value={tags}
            placeholder="Kept with the draft only"
            onChange={(event) => setTags(event.target.value)}
          />
          {messageType === 'invite' ? (
            <>
              <h3 style={{ marginTop: 16 }}>Invite Members</h3>
              <p>
                Enter email addresses separated by commas or newlines. Invites
                are not sent to people who are already members.
              </p>
              <Area
                placeholder="Enter email addresses here!"
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
              <select
                id="application-id"
                value={applicationId}
                onChange={(event) =>
                  setApplicationId(Number(event.target.value))
                }
                style={{ width: '100%' }}
              >
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name}
                  </option>
                ))}
              </select>
              <InputLabel htmlFor="email-kind">Email</InputLabel>
              <select
                id="email-kind"
                value={emailKind}
                onChange={(event) =>
                  setEmailKind(event.target.value as 'acceptance' | 'rejection')
                }
                style={{ width: '100%' }}
              >
                <option value="acceptance">Acceptance</option>
                <option value="rejection">Rejection</option>
              </select>
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
            </>
          )}
          <InputLabel htmlFor="message-body">Body</InputLabel>
          <Area
            id="message-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <SendRow>
            <SendButton
              type="button"
              className="button"
              disabled={sendDisabled}
              data-testid="invite-emails-submit"
              onClick={() =>
                messageType === 'invite'
                  ? sendInvites()
                  : sendApplication(false, false)
              }
            >
              <Icon name="send" alt="" />{' '}
              {messageType === 'invite' ? 'Send Invite' : 'Send'}
            </SendButton>
            {messageType === 'application' && (
              <Menu>
                <GhostButton
                  type="button"
                  onClick={() => setSendMenu((open) => !open)}
                >
                  ▾
                </GhostButton>
                {sendMenu && (
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
            )}
            <GhostButton type="button" onClick={saveDraft}>
              Save Draft
            </GhostButton>
          </SendRow>
          <Hint>{sendHint}</Hint>
          </Composer>
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
            <InputLabel htmlFor="member-role">Role</InputLabel>
            <select
              id="member-role"
              value={editing.role}
              onChange={(event) =>
                setEditing({ ...editing, role: Number(event.target.value) })
              }
            >
              {MEMBERSHIP_ROLES.filter(
                ({ value }) => value in MEMBERSHIP_ROLE_NAMES,
              ).map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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
            <SendButton type="submit">Save member</SendButton>
          </form>
        </Modal>
      )}
    </>
  )
}
