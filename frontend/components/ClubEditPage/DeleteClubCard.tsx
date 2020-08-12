import { ReactElement, useEffect, useState } from 'react'

import { Club } from '../../types'
import { apiCheckPermission, doApiRequest, formatResponse } from '../../utils'
import { Contact, Icon, Text } from '../common'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  notify?: (message: ReactElement | string) => void
  onDelete?: () => void
}

const DeleteClubCard = ({
  club,
  notify = () => undefined,
  onDelete = () => undefined,
}: Props): ReactElement => {
  const [canDelete, setCanDelete] = useState<boolean>(club && !club.active)

  useEffect(() => {
    apiCheckPermission('clubs.delete_club').then((perm) =>
      setCanDelete((canDelete) => canDelete || perm),
    )
  }, [])

  const deleteClub = (): void => {
    if (club === null) {
      return
    }

    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'DELETE',
    }).then((resp) => {
      if (resp.ok) {
        notify('Successfully deleted club.')
        onDelete()
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err))
        })
      }
    })
  }

  return (
    <BaseCard title="Delete Club">
      <Text>
        Remove this club entry from Penn Clubs.{' '}
        <b className="has-text-danger">
          This action is permanent and irreversible!
        </b>{' '}
        All club history and membership information will be permanently lost. In
        almost all cases, you want to deactivate this club instead.
      </Text>
      <div className="buttons">
        {canDelete ? (
          <a
            className="button is-danger is-medium"
            onClick={() => deleteClub()}
          >
            <Icon name="trash" alt="delete" /> Delete Club
          </a>
        ) : (
          <b>
            <b>{club.name}</b> must be deactivated before performing this
            action. To deactivate your club, contact <Contact />.
          </b>
        )}
      </div>
    </BaseCard>
  )
}

export default DeleteClubCard
