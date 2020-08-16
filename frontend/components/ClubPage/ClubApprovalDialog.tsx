import { useRouter } from 'next/router'
import { ReactElement, useEffect, useState } from 'react'

import { Club, UserInfo } from '../../types'
import { apiCheckPermission, doApiRequest } from '../../utils'
import { Contact, Icon, Text } from '../common'

type Props = {
  club: Club
  userInfo: UserInfo
}

const ClubApprovalDialog = ({ club, userInfo }: Props): ReactElement | null => {
  const router = useRouter()
  const year = new Date().getFullYear()

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
            This club has been marked as <b>rejected</b> and is only visible to
            administrators of Penn Clubs. If you believe that this is a mistake,
            contact <Contact />.
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
            request.
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
          <div className="buttons">
            <button
              className="button is-success"
              onClick={() => {
                doApiRequest(`/clubs/${club.code}/?format=json`, {
                  method: 'PATCH',
                  body: {
                    approved: true,
                  },
                })
                  .then((resp) => resp.json())
                  .then(() => router.reload())
              }}
            >
              <Icon name="check" /> Approve
            </button>
            {club.approved !== false && (
              <button
                className="button is-danger"
                onClick={() => {
                  doApiRequest(`/clubs/${club.code}/?format=json`, {
                    method: 'PATCH',
                    body: {
                      approved: false,
                    },
                  })
                    .then((resp) => resp.json())
                    .then(() => router.reload())
                }}
              >
                <Icon name="x" /> Reject
              </button>
            )}
          </div>
        </>
      )}
    </div>
  ) : null
}

export default ClubApprovalDialog
