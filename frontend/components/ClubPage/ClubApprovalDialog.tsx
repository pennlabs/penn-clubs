import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'
import s from 'styled-components'

import { MEDIUM_GRAY } from '../../constants'
import { Club, MembershipRank, UserInfo } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import { Contact, Icon, Text } from '../common'

const ReviewQuote = s.span`
  white-space: pre-wrap;
  display: block;
  margin-top: 12px;
  margin-bottom: 5px;
  padding: 5px;
  padding-left: 12px;
  border-left: 3px solid ${MEDIUM_GRAY};
  color: ${MEDIUM_GRAY};
  font-size: 1.2em;
`

type Props = {
  club: Club
  userInfo: UserInfo
}

const ClubApprovalDialog = ({ club, userInfo }: Props): ReactElement | null => {
  const router = useRouter()
  const year = new Date().getFullYear()
  const [comment, setComment] = useState<string>(club.approved_comment || '')
  const [loading, setLoading] = useState<boolean>(false)

  const [canApprove, setCanApprove] = useState<boolean>(
    userInfo && userInfo.is_superuser,
  )

  useEffect(() => {
    apiCheckPermission('clubs.approve_club').then(setCanApprove)
  }, [])

  return club.active && club.approved !== true ? (
    <div className="notification is-warning">
      <Text>
        {club.approved === false ? (
          <>
            <p>
              This club has been marked as <b>not approved</b> and is only
              visible to administrators of Penn Clubs. The reason that your club
              was not approved by the Office of Student Affairs is listed below.
              If you believe that this is a mistake, contact <Contact />.
            </p>
            <ReviewQuote>
              {club.approved_comment || (
                <>
                  No reason has been given for why your club was not approved.
                  Contact <Contact point="osa" /> for more details.
                </>
              )}
            </ReviewQuote>
          </>
        ) : (
          <>
            This club has <b>not been approved yet</b> for the {year}-{year + 1}{' '}
            school year and is only visible to club members and administrators
            of Penn Clubs.
          </>
        )}
      </Text>
      {canApprove && (
        <>
          <div className="mb-3">
            As an administrator for Penn Clubs, you can approve or reject this
            request. Approving this request will display it publically on the
            Penn Clubs website and send out an email notifying club officers
            that their club has been renewed. Rejecting this request will send
            out an email notifying club officers that their club was not
            approved and include instructions on how to request approval again.
          </div>
          {club.files.length ? (
            <div className="mb-3">
              <b>Club Files:</b>
              <ul>
                {club.files.map(({ name, file_url }, i) => (
                  <li key={i}>
                    <a target="_blank" href={file_url}>
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mb-3">This club has not uploaded any files.</div>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="textarea mb-4"
            placeholder="Enter approval or rejection notes here! Your notes will be sent to the club officers when you approve or reject this request."
          ></textarea>
          <div className="buttons">
            <button
              className="button is-success"
              disabled={loading}
              onClick={() => {
                setLoading(true)
                doApiRequest(`/clubs/${club.code}/?format=json`, {
                  method: 'PATCH',
                  body: {
                    approved: true,
                    approved_comment: comment,
                  },
                })
                  .then(() => router.reload())
                  .finally(() => setLoading(false))
              }}
            >
              <Icon name="check" /> Approve
            </button>
            <button
              className="button is-danger"
              disabled={loading}
              onClick={() => {
                setLoading(true)
                doApiRequest(`/clubs/${club.code}/?format=json`, {
                  method: 'PATCH',
                  body: {
                    approved: false,
                    approved_comment: comment,
                  },
                })
                  .then(() => router.reload())
                  .finally(() => setLoading(false))
              }}
            >
              <Icon name="x" /> Reject
            </button>
          </div>
        </>
      )}
      {club.approved === false &&
        club.is_member !== false &&
        club.is_member <= MembershipRank.Officer && (
          <>
            <div className="mb-3">
              You can edit your club details using the <b>Edit Club</b> button
              on this page. After you have addressed the issues mentioned above,
              you can request renewal again using the button below.
            </div>
            <button
              className="button is-warning is-light"
              onClick={() => {
                doApiRequest(`/clubs/${club.code}/?format=json`, {
                  method: 'PATCH',
                  body: {
                    approved: null,
                  },
                }).then(() => router.reload())
              }}
            >
              Request Review
            </button>
          </>
        )}
    </div>
  ) : null
}

export default ClubApprovalDialog
