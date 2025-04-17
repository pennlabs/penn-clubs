import { ReactElement, useEffect, useState } from 'react'
import Select from 'react-select'
import TimeAgo from 'react-timeago'
import { toast, TypeOptions } from 'react-toastify'

import { Club, MembershipRank, MembershipRole } from '../../types'
import { doApiRequest, formatResponse, getRoleDisplay } from '../../utils'
import {
  MEMBERSHIP_ROLE_NAMES,
  OBJECT_INVITE_LABEL,
  OBJECT_MEMBERSHIP_DEFAULT_TITLE,
  OBJECT_MEMBERSHIP_LABEL,
  OBJECT_MEMBERSHIP_LABEL_LOWERCASE,
  OBJECT_NAME_SINGULAR,
  SCHOOL_NAME,
} from '../../utils/branding'
import { Icon, Text } from '../common'
import BaseCard from './BaseCard'
import { MEMBERSHIP_ROLES } from './MembersCard'

type InviteCardProps = {
  club: Club
}

type Invite = {
  id: number
  email: string
  title: string
  role: number
  updated_at: string
}

export default function InviteCard({
  club,
}: InviteCardProps): ReactElement<any> {
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteTitle, setInviteTitle] = useState<string>(
    OBJECT_MEMBERSHIP_DEFAULT_TITLE,
  )
  const [inviteRole, setInviteRole] = useState<MembershipRole>(
    () =>
      MEMBERSHIP_ROLES.find(({ value }) => value in MEMBERSHIP_ROLE_NAMES) ??
      MEMBERSHIP_ROLES[0],
  )
  const [invitePercentage, setInvitePercentage] = useState<number | null>(null)
  const [inviteEmails, setInviteEmails] = useState<string>('')
  const [isInviting, setInviting] = useState<boolean>(false)

  const notify = (
    msg: ReactElement<any> | string,
    type: TypeOptions = 'info',
  ): void => {
    toast[type](msg)
  }

  const reloadInvites = (): void => {
    doApiRequest(`/clubs/${club.code}/invites/?format=json`)
      .then((resp) => resp.json())
      .then(setInvites)
  }

  const deleteInvite = (id: string | number): void => {
    doApiRequest(`/clubs/${club.code}/invites/${id}/?format=json`, {
      method: 'DELETE',
    }).then((resp) => {
      if (resp.ok) {
        notify('Invitation has been removed!', 'success')
        reloadInvites()
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  const resendInvite = (id) => {
    doApiRequest(`/clubs/${club.code}/invites/${id}/resend/?format=json`, {
      method: 'PUT',
    })
      .then((resp) => resp.json())
      .then((resp) => {
        notify(resp.detail)
      })
  }

  const sendInviteBatch = async (emails: string[]) => {
    const resp = doApiRequest(`/clubs/${club.code}/invite/?format=json`, {
      method: 'POST',
      body: {
        emails: emails.join('\n'),
        role: inviteRole.value,
        title: inviteTitle,
      },
    })

    try {
      const json = (await resp).json()
      return json
    } catch (e) {
      return {
        success: false,
        detail: 'An unknown error occured while sending an invitation batch.',
      }
    }
  }

  const sendInvites = async () => {
    const emails = inviteEmails
      .split(/(?:\n|\||,)/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    setInviting(true)

    if (emails.length <= 10) {
      try {
        const data = await sendInviteBatch(emails)
        if (data.success) {
          setInviteEmails('')
        }
        notify(
          'detail' in data ? data.detail : formatResponse(data),
          data.success ? 'success' : 'error',
        )
      } finally {
        reloadInvites()
        setInviting(false)
      }
    } else {
      setInvitePercentage(0)
      const chunks: string[][] = []
      for (let i = 0; i < emails.length; i += 10) {
        chunks.push(emails.slice(i, i + 10))
      }

      const responses: { sent: number; skipped: number }[] = []
      for (let i = 0; i < chunks.length; i++) {
        const data = await sendInviteBatch(chunks[i])
        if (!data.success) {
          notify(formatResponse(data), 'error')
          reloadInvites()
          setInviting(false)
          setInvitePercentage(null)
          return
        }
        setInvitePercentage((i + 1) / chunks.length)
        responses.push(data)
      }

      notify(
        <>
          Sent invites to{' '}
          {responses.map((resp) => resp.sent).reduce((a, b) => a + b, 0)}{' '}
          emails!{' '}
          {responses.map((resp) => resp.skipped).reduce((a, b) => a + b, 0)}{' '}
          emails were skipped because they are already invited or a member.
        </>,
        'success',
      )
      setInviteEmails('')
      reloadInvites()
      setInviting(false)
      setInvitePercentage(null)
    }
  }

  const updatePermissions = (opt: MembershipRole) => {
    setInviteRole(opt)

    if (MEMBERSHIP_ROLES.map((role) => role.label).includes(inviteTitle)) {
      setInviteTitle(opt.label)
    }
  }

  useEffect(reloadInvites, [])

  return (
    <>
      {invites && !!invites.length && (
        <BaseCard title={`Pending Invites (${invites.length})`}>
          <table className="table is-fullwidth">
            <thead>
              <tr>
                <th>Email</th>
                <th>Title (Permissions)</th>
                <th>Invite Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((item) => (
                <tr key={item.email}>
                  <td>{item.email}</td>
                  <td>
                    {item.title} ({getRoleDisplay(item.role)})
                  </td>
                  <td>
                    <TimeAgo date={item.updated_at} />
                  </td>
                  <td>
                    <button
                      className="button is-small is-link"
                      onClick={() => resendInvite(item.id)}
                    >
                      <Icon name="mail" alt="resend invite" /> Resend
                    </button>{' '}
                    <button
                      className="button is-small is-danger"
                      onClick={() => deleteInvite(item.id)}
                    >
                      <Icon name="x" alt="remove invite" /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </BaseCard>
      )}
      <BaseCard title={`Invite ${OBJECT_INVITE_LABEL}`}>
        <Text>
          Enter a {OBJECT_MEMBERSHIP_LABEL_LOWERCASE} email address or a list of
          email addresses separated by commas or newlines in the box below.
        </Text>
        <Text>
          All emails listed will be sent an invite to join the{' '}
          {OBJECT_NAME_SINGULAR}. The invite process will go more smoothly if
          you use {SCHOOL_NAME} email addresses, but normal email addresses will
          work provided that the recipient has a valid PennKey account. We will
          not send an invite if the account associated with an email is already
          in the {OBJECT_NAME_SINGULAR} or if an invite associated with that
          email already exists.
        </Text>
        <div className="field">
          <textarea
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            className="textarea"
            placeholder="Enter email addresses here!"
            data-testid="invite-emails-input"
          ></textarea>
        </div>
        <div className="field">
          <label className="label">Permissions</label>
          <div className="control">
            <Select
              options={MEMBERSHIP_ROLES.filter(
                ({ value }) => value in MEMBERSHIP_ROLE_NAMES,
              )}
              value={inviteRole}
              onChange={updatePermissions}
            />
          </div>
          <p className="help">
            {Object.keys(MEMBERSHIP_ROLE_NAMES)
              .sort((role) => MembershipRank[role])
              .map((role) => {
                return `${MEMBERSHIP_ROLE_NAMES[role]}s ${
                  {
                    [MembershipRank.Owner]: `have full control over the ${OBJECT_NAME_SINGULAR}`,
                    [MembershipRank.Officer]: 'can perform editing',
                    [MembershipRank.Member]: 'have read-only permissions',
                  }[role]
                }`
              })
              .join(', ')}
          </p>
        </div>
        <div className="field">
          <label className="label">Title</label>
          <div className="control">
            <input
              className="input"
              value={inviteTitle}
              onChange={(e) => setInviteTitle(e.target.value)}
            />
          </div>
          <p className="help">
            The title is shown on the {OBJECT_MEMBERSHIP_LABEL.toLowerCase()}{' '}
            listing and will not affect user permissions.
          </p>
        </div>
        {invitePercentage !== null && (
          <div className="mb-3">
            <progress
              className="progress"
              value={(invitePercentage ?? 0) * 100}
              max={100}
            />
          </div>
        )}
        <button
          disabled={isInviting}
          className="button is-primary"
          onClick={sendInvites}
          data-testid="invite-emails-submit"
        >
          <Icon name="mail" alt="send invites" />
          &nbsp; Send Invite(s)
        </button>
      </BaseCard>
    </>
  )
}
