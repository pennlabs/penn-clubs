import { ReactElement } from 'react'

import { Club } from '../../types'
import { apiCheckPermission, doApiRequest, formatResponse } from '../../utils'
import {
  OBJECT_NAME_SINGULAR,
  OBJECT_NAME_TITLE_SINGULAR,
  SITE_NAME,
} from '../../utils/branding'
import { Contact, Icon, Text } from '../common'
import BaseCard from './BaseCard'

type Props = {
  club: Club
  notify?: (message: ReactElement<any> | string, type?: string) => void
  onDelete?: () => void
}

const DeleteClubCard = ({
  club,
  notify = () => undefined,
  onDelete = () => undefined,
}: Props): ReactElement<any> => {
  const canDelete = apiCheckPermission([
    'clubs.delete_club',
    `clubs.delete_club:${club.code}`,
  ])

  const deleteClub = (): void => {
    if (club === null) {
      return
    }

    doApiRequest(`/clubs/${club.code}/?format=json`, {
      method: 'DELETE',
    }).then((resp) => {
      if (resp.ok) {
        notify(`Successfully deleted ${OBJECT_NAME_SINGULAR}.`, 'success')
        onDelete()
      } else {
        resp.json().then((err) => {
          notify(formatResponse(err), 'error')
        })
      }
    })
  }

  return (
    <BaseCard title={`Delete ${OBJECT_NAME_TITLE_SINGULAR}`}>
      <Text>
        Remove this {OBJECT_NAME_SINGULAR} entry from {SITE_NAME}.{' '}
        <b className="has-text-danger">
          This action is permanent and irreversible!
        </b>{' '}
        All {OBJECT_NAME_SINGULAR} history and membership information will be
        permanently lost. In almost all cases, you want to deactivate this{' '}
        {OBJECT_NAME_SINGULAR} instead.
      </Text>
      <div className="buttons">
        {canDelete ? (
          <a
            className="button is-danger is-medium"
            onClick={() => deleteClub()}
          >
            <Icon name="trash" alt="delete" /> Delete{' '}
            {OBJECT_NAME_TITLE_SINGULAR}
          </a>
        ) : (
          <b>
            <b>{club.name}</b> must be deactivated before performing this
            action. To deactivate your {OBJECT_NAME_SINGULAR}, contact{' '}
            <Contact />.
          </b>
        )}
      </div>
    </BaseCard>
  )
}

export default DeleteClubCard
